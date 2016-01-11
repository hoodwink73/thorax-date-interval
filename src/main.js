import 'bootstrap_css';
import 'bootstrap_js';
import 'datepicker_css';
import 'datepicker';
import '../sass/main.scss';
import 'imports!thorax';
import moment from 'moment';

import DateRangeView from './thorax-date-interval';
import dateRangeTemplate from '../templates/daterange-example.hbs';

const view = new DateRangeView({
  template: Handlebars.compile(dateRangeTemplate),
  config: {
    validators: {
      cannotExceedThreeMonths (from, to) {
        if (to.isSameOrBefore(from.add(3, 'months'))) {
          return true;
        } else {
          return {
            message: `The interval could not be more than 3 months`
          }
        }
      },
      // shouldBeAWeekApart (from, to) {
      //   if (to.isSameOrAfter(from.add(7, 'days'))) {
      //     return true;
      //   } else {
      //     return {
      //       message: `Minimum interval between the selected dates should be at
      //                 least seven days`
      //     }
      //   }
      // }
    },
    minDate: {
      from: moment().subtract(7, 'days')
    },
    quickActions: [
      {
        title: 'Yesterday',
        from: moment().subtract(1, 'day'),
        to: moment().subtract(1, 'day')
      },
      {
        title: 'Today',
        from: moment(),
        to: moment()
      },
      {
        title: 'Previous Week',
        from: moment().subtract(1, 'weeks').startOf('isoWeek'),
        to: moment().subtract(1, 'weeks').endOf('isoWeek')
      },
      {
        title: 'Last 7 Days',
        from: moment().subtract(7, 'days'),
        to: moment()
      },
      {
        title: 'Previous Month',
        from: moment().subtract(1, 'months').startOf('month'),
        to: moment().subtract(1, 'months').endOf('month')
      },
      {
        title: 'Last 30 days',
        from: moment().subtract(30, 'days'),
        to: moment()
      },
    ],
    submitButtonText: 'Download Report'
  }
}).render();


window.app = {};

app.view = view;

view.appendTo($('.calender-placeholder'));
