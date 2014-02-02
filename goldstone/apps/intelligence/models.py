# vim: tabstop=4 shiftwidth=4 softtabstop=4

#
# Copyright 2014 Solinea, Inc.
#


from django.db import models
from django.conf import settings

from datetime import datetime, timedelta
from elasticsearch import *
import pytz
import calendar
import logging

logger = logging.getLogger(__name__)


class LogData(object):

    @staticmethod
    def _subtract_months(sourcedate, months):

        month = sourcedate.month - 1 - months
        year = sourcedate.year + month / 12
        month = month % 12 + 1
        day = min(sourcedate.day, calendar.monthrange(year, month)[1])
        return datetime(year, month, day, sourcedate.hour,
                        sourcedate.minute, sourcedate.second,
                        sourcedate.microsecond, sourcedate.tzinfo)

    def _calc_start(self, end, unit):

        if unit == "hour":
            t = end - timedelta(hours=1)
        elif unit == "day":
            t = end - timedelta(days=1)
        elif unit == "week":
            t = end - timedelta(weeks=1)
        else:
            t = self._subtract_months(end, 1)
        return t.replace(tzinfo=pytz.utc)

    def _range_query(self, field, start, end, gte=True, lte=True, facet=None):

        start_op = "gte" if gte else "gt"
        end_op = "lte" if lte else "lt"
        result = {
            "query": {
                "range": {
                    field: {
                        start_op: start,
                        end_op: end
                    }
                }
            }
        }

        if facet:
            result = self._add_facet(result, facet)

        return result

    @staticmethod
    def _add_facet(q, facet):

        result = q.copy()
        if not 'facets' in result:
            result['facets'] = {}

        result['facets'][facet.keys()[0]] = facet[facet.keys()[0]]
        return result

    @staticmethod
    def _term_filter(field, value):

        return {
            "term": {
                field: value
            }
        }

    @staticmethod
    def _term_facet(name, field, facet_filter=None, all_terms=True,
                    order=None):
        result = {
            name: {
                "terms": {
                    "field": field,
                    "all_terms": all_terms
                }
            }
        }

        if order:
            result[name]['terms']['order'] = order

        if facet_filter:
            result[name]['facet_filter'] = facet_filter

        return result

    @staticmethod
    def _date_hist_facet(name, field, interval, facet_filter=None):
        result = {
            name: {
                "date_histogram": {
                    "field": field,
                    "interval": interval
                }
            }
        }

        if facet_filter:
            result[name]['facet_filter'] = facet_filter

        return result

    def _get_term_facet_terms(self, conn, facet_field):
        fac = self._term_facet(facet_field, facet_field, order='term')
        q = dict(query={
            'match_all': {}
        })

        q['facets'] = {}
        q['facets'][fac.keys()[0]] = fac[fac.keys()[0]]
        logger.debug("[_get_term_facet_terms] query = %s", q)
        rs = conn.search(index="_all", body=q)
        return [d['term'] for d in rs['facets'][facet_field]['terms']]

    @staticmethod
    def get_connection(server):
        return Elasticsearch(server)

    def err_and_warn_hist(self, conn, start, end, interval,
                          query_filter=None):

        q = self._range_query('@timestamp', start.isoformat(), end.isoformat())
        err_filt = self._term_filter('loglevel', 'error')
        fat_filt = self._term_filter('loglevel', 'fatal')
        bad_filt = {'or': [err_filt, fat_filt]}
        warn_filt = self._term_filter('loglevel', 'warning')

        f1 = bad_filt if not query_filter \
            else {'and': [bad_filt, query_filter]}

        f2 = warn_filt if not query_filter \
            else {'and': [warn_filt, query_filter]}

        err_fac = self._date_hist_facet("err_facet", "@timestamp", interval,
                                        facet_filter=f1)
        warn_fac = self._date_hist_facet("warn_facet", "@timestamp", interval,
                                         facet_filter=f2)
        q = self._add_facet(q, err_fac)
        q = self._add_facet(q, warn_fac)
        logger.debug("[err_and_warn_hist] query = %s", q)
        return conn.search(index="_all", body=q)

    def get_components(self, conn):
        return self._get_term_facet_terms(conn, "component")

    def get_loglevels(self, conn):
        return self._get_term_facet_terms(conn, "loglevel")

    def range_filter_facet(self, conn, start, end, filter_field, filter_value,
                           facet_field, facet_order=None):

        filt = self._term_filter(filter_field, filter_value)
        fac = self._term_facet(facet_field, facet_field, filt, order='term')
        rangeq = self._range_query('@timestamp', start.isoformat(),
                                   end.isoformat())
        rangeq = self._add_facet(rangeq, fac)
        logger.debug("[range_filter_facet] query = %s", rangeq)
        return conn.search(index="_all", body=rangeq)

    def aggregate_facets(self, conn, start, end, filter_field, filter_list,
                         facet_field):

        result = {}
        for filt in filter_list:
            rff = self.range_filter_facet(conn, start, end, filter_field, filt,
                                          facet_field)
            result[filt] = rff['facets']

        return result

    def get_err_and_warn_hists(self, conn, start, end, interval=None):

        if interval == 'minute':
            search_interval = 'second'
        elif interval == 'hour':
            search_interval = 'minute'
        elif interval == 'day':
            search_interval = 'hour'
        elif interval == 'month':
            search_interval = 'day'
        else:
            search_interval = 'hour'

        result = self.err_and_warn_hist(conn, start, end,
                                        search_interval)['facets']

        return result

    def get_err_and_warn_range(self, conn, start_t, end_t, first, size,
                               sort='', global_filter_text=None):

        # TODO refactor this block of code, seen it before...
        q = self._range_query('@timestamp', start_t.isoformat(),
                              end_t.isoformat())

        err_filt = self._term_filter('loglevel', 'error')
        fat_filt = self._term_filter('loglevel', 'fatal')
        warn_filt = self._term_filter('loglevel', 'warning')
        bad_filt = {'or': [err_filt, fat_filt, warn_filt]}

        global_filt = self._term_filter('_all',
                                        global_filter_text.lower()) \
            if global_filter_text and global_filter_text != '' else None
        f1 = bad_filt if not global_filt \
            else {'and': [bad_filt, global_filt]}

        q['filter'] = f1
        fq = {
            'query': {'filtered': q}
        }

        logger.debug("[get_err_warn_range] query = %s", fq)
        return conn.search(index="_all", body=fq, from_=first, size=size,
                           sort=sort)

    def get_new_and_missing_nodes(self, conn, long_lookback, short_lookback,
                                  end=datetime.now(tz=pytz.utc)):

        host_facet = self._term_facet('host_facet', 'host.raw',
                                      all_terms=False, order='term')
        q1 = self._range_query('@timestamp', long_lookback.isoformat(),
                               short_lookback.isoformat(), facet=host_facet)
        q2 = self._range_query('@timestamp', short_lookback.isoformat(),
                               end.isoformat(),
                               facet=host_facet)

        r1 = conn.search(index="_all", body=q1)
        r2 = conn.search(index="_all", body=q2)

        logger.debug("[get_new_and_missing_nodes] query1 = %s", q1)
        logger.debug("[get_new_and_missing_nodes], query2 = %s", q2)

        # new hosts are in q2, but not in q1
        # absent hosts are in q1, but not in q2
        # everything else is less interesting

        s1 = set([fac['term'] for fac in
                  r1['facets']['host_facet']['terms']])
        s2 = set([fac['term'] for fac in
                  r2['facets']['host_facet']['terms']])

        new_nodes = s2.difference(s1)
        missing_nodes = s1.difference(s2)
        logger.debug("[get_new_and_missing_nodes] missing_nodes = %s",
                     missing_nodes)
        logger.debug("[get_new_and_missing_nodes] new_nodes = %s", new_nodes)
        return {
            "missing_nodes": list(missing_nodes),
            "new_nodes": list(new_nodes)
        }