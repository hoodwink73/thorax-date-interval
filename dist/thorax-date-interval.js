'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Thorax.View.extend({
  initialize: function initialize() {
    this.calendars = {};
    this.validators = [];

    // add the validators passed inside the options
    if (_.has(this.config, 'validators')) {
      var config = this.config;
      for (var validator in config.validators) {
        this._addvalidators(config.validators[validator]);
      }
    }

    this.config = _.extend(this.defaults, this.config || {});

    // when 'from' date is selected for the **first** time
    // only then we want to set the **to** date given the default interval,
    // for every subsequent 'from' date change there would be no change in 'to'
    this._setDefaultForTo = _.once(this._setDefaultForTo).bind(this);
  },
  defaults: {
    format: 'DD/MM/YYYY',
    // the default date range on the calendar
    // expressed in days
    defaultInterval: 7
  },
  events: {
    rendered: function rendered() {
      var _this = this;

      var self = this;

      this.ui = {
        'submit': this.$('.submit-button')
      };

      // the deafult date range
      var defaultDates = {
        from: moment().subtract(this.config.defaultInterval, 'days'),
        to: moment()
      };

      _.each(['from', 'to'], function (calendar) {
        var minDate = _.has(self.config, 'minDate') ? self.config.minDate[calendar] : undefined;

        var maxDate = _.has(self.config, 'maxDate') ? self.config.maxDate[calendar] : undefined;

        _this.calendars[calendar] = _this.$('#' + calendar).datetimepicker({
          inline: true,
          format: 'DD/MM/YYYY',
          date: defaultDates[calendar],
          minDate: minDate,
          maxDate: maxDate
        });
        _this._registerDateChangeEvent(calendar);
      });

      this._setSelectedDateInFooter();
    },

    // event handler whenever a date changes on any of the calendars
    'change:date': function changeDate(changeObj) {
      this._validate();

      // when the 'from' date is selected, use 'defaultInterval'
      // to select the 'to' date. this happens only once
      if (changeObj.calendar === 'from') {
        this._setDefaultForTo();
      }

      this._setSelectedDateInFooter();
    },

    'validation:error': function validationError(error) {}
  },
  getCalendar: function getCalendar(calendar) {
    // this is a constraint of the bootstrap date time library
    // All functions are accessed via the data attribute e.g.
    //  $('#datetimepicker').data("DateTimePicker").FUNCTION()
    return this.calendars[calendar].data('DateTimePicker');
  },
  setDate: function setDate(calendar, date) {
    if (!date instanceof moment) {
      console.error('Date must be an instancce of moment');
    }
    this.getCalendar(calendar).date(date);
  },
  getDate: function getDate(calendar, date) {
    return this.getCalendar(calendar).date();
  },
  _registerDateChangeEvent: function _registerDateChangeEvent(calendar) {
    var self = this;
    this.calendars[calendar].on('dp.change', function (changeEvent) {
      var newDate = changeEvent.date;
      var oldDate = changeEvent.oldDate;
      self.trigger('change:date', {
        calendar: calendar,
        newDate: newDate,
        oldDate: oldDate
      });
    });
  },
  _addvalidators: function _addvalidators(validator) {
    this.validators.push(validator);
  },
  _validate: function _validate() {
    var self = this;
    _.every(this.validators, function (validator) {
      var result = validator.call(self, self.getDate('from'), self.getDate('to'));

      if (_.isObject(result) && _.has(result, 'message')) {
        self.trigger('validation:error', result.message);
        return false;
      } else {
        return true;
      }
    });
  },
  _setDefaultForTo: function _setDefaultForTo() {
    this.setDate('to', this.getDate('from').add(this.config.defaultInterval, 'days'));
  },
  _setSelectedDateInFooter: function _setSelectedDateInFooter() {
    var buttonPrefix = this.config.submitButtonText || 'Download';
    var fromDate = this.getDate('from').format('DD MMM');
    var toDate = this.getDate('to').format('DD MMM');

    this.ui.submit.html(buttonPrefix + ' for ' + fromDate + ' to ' + toDate);
  }
});