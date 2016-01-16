'use strict';

define(['exports'], function (exports) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Thorax.View.extend({
    initialize: function initialize() {
      var _this = this;

      // reference to the 'from' and 'to' calendar
      this.calendars = {};
      // all validators given by user inside config when
      // instantiating the view
      this.validators = [];

      // add the validators passed inside the config
      if (_.has(this.config, 'validators')) {
        var config = this.config;
        for (var validator in config.validators) {
          // just push each validator fn inside `this.validators`
          this._addvalidators(config.validators[validator]);
        }
      }

      this.config = _.extend(this.defaults, this.config || {
        // these defaults help us to avoid writing excess code to prevent
        // key lookup on undefined
        minDate: {},
        maxDate: {}
      });

      // we check if all the quick actions interval gets validated
      // if not they are disabled
      _.each(this.config.quickActions, function (action) {
        if (!_this._validateInterval(action, { noEvents: true })) {
          _.tap(action, function () {
            return action.disabled = true;
          });
        }
      });

      // when 'from' date is selected for the **first** time
      // only then we want to set the **to** date given the default interval,
      // for every subsequent 'from' date change there would be no change in 'to'
      // the function once, no matter how many times you call it
      this._setDefaultForTo = _.once(this._setDefaultForTo).bind(this);
    },
    defaults: {
      format: 'DD/MM/YYYY',
      // the default date range on the calendar
      // expressed in days, used when the user first
      // clicks on `from` date, it automatically selects
      // the `to` date. But this happens only once
      defaultInterval: 7,
      useCurrent: true
    },
    events: {
      rendered: function rendered() {
        var self = this;

        this.ui = {
          'submit': this.$('.submit-button')
        };
        this._initCalendars();
      },

      'change:date': function changeDate(changeObj) {
        // event handler whenever a date changes on any of the calendars
        var didValidate = this._validate();
        if (didValidate) {
          // the `to` date cannot be earlier than `from`
          if (changeObj.calendar === 'from') {
            this.getCalendar('to').minDate(this.getDate('from'));
          }
        }
      },
      'validation:error': function validationError(error) {
        console.error(error);
      },
      'click .action': '_selectDateFromQuickAction'
    },
    getCalendar: function getCalendar(calendar) {
      // this is a constraint of the bootstrap date time library
      // All functions are accessed via the data attribute e.g.
      //  $('#datetimepicker').data("DateTimePicker").FUNCTION()
      // hence this is sugar method to avoid the extra code
      // and its essential to API of date-interval
      return this.calendars[calendar].data('DateTimePicker');
    },
    getDate: function getDate(calendar) {
      return this.getCalendar(calendar).date();
    },
    setDate: function setDate(calendar, date) {
      if (!moment.isMoment(date)) {
        console.error('Date must be an instance of moment');
      }

      this.getCalendar(calendar).date(date);
    },
    getInterval: function getInterval() {
      return {
        from: this.getDate('from'),
        to: this.getDate('to')
      };
    },
    setInterval: function setInterval(intervalObj) {
      // here's what an `intervalObj` should look like
      // {
      //   from: <moment>,
      //   to: <moment>
      // }

      if (_.isObject(intervalObj) && _.has(intervalObj, 'from') && _.has(intervalObj, 'to')) {
        if (moment.isMoment(intervalObj.from) && moment.isMoment(intervalObj.to)) {
          // this validate method emits an error event
          // so this method doesn not do anything regarding throwing errors
          if (this._validateInterval(intervalObj)) {
            // TODO: these setDate would again call validate in turn
            // we need to avoid this
            this.setDate('from', intervalObj.from);
            this.setDate('to', intervalObj.to);
            return true;
          } else {
            return false;
          }
        } else {
          console.error('Value of \'from\' and \'to\' should be moment instances');
        }
      } else {
        console.error('Interval should be an object with `from` and `to` as keys');
      }
    },
    _initCalendars: function _initCalendars() {
      var _this2 = this;

      _.each(['from', 'to'], function (calendar) {
        var minDate = _.has(_this2.config, 'minDate') ? _this2.config.minDate[calendar] : undefined;

        var maxDate = _.has(_this2.config, 'maxDate') ? _this2.config.maxDate[calendar] : undefined;

        var useCurrent = _this2.config.useCurrent;

        _this2.calendars[calendar] = _this2.$('#' + calendar).datetimepicker({
          inline: true,
          format: 'DD/MM/YYYY',
          minDate: minDate,
          maxDate: maxDate,
          useCurrent: useCurrent
        });

        _this2._registerDateChangeEvent(calendar);
      });
    },
    _registerDateChangeEvent: function _registerDateChangeEvent(calendar) {
      // hooking into the date-picker's date change event and
      // and we augment the information of which calendar fired the event
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
      // this only validates date selected(clicked) by user, so in essence, it
      //  always get either a `from` or `to` but not the interval
      var self = this;
      var didValidate = undefined,
          from = undefined,
          to = undefined;

      // okay, we need to clone these moment instances otherwise
      // the source(config.quickActions) getting passed, will get mutated
      // by the validator function
      from = self.getDate('from').clone();
      to = self.getDate('to').clone();

      // no need to validate min and max date as they can't be
      // selected by users
      didValidate = this._validateConfigValidators({
        from: from,
        to: to
      });

      return didValidate;
    },
    _validateInterval: function _validateInterval(interval, options) {
      // only used when the interval is getting saved programatically
      // i.e not on user clicks on individual calendar dates
      var didValidate = undefined,
          from = undefined,
          to = undefined;

      if (_.isObject(interval)) {
        if (_.has(interval, 'from') && _.has(interval, 'to')) {
          // okay, we need to clone these moment instances otherwise
          // the source(config.quickActions) getting passed, will get mutated
          // by the validator function.
          // PHEW!! Completely forgot about object mutation, took a while to
          // figure out
          from = interval.from.clone();
          to = interval.to.clone();

          // validate against the min and max date, in case this invalid
          // dates can still be set, because they are being set programatically
          // passing the cloned moment objects here
          // error will be emitted by `this._validateMinMax()`
          didValidate = this._validateMinMax({
            from: from,
            to: to
          }, options);

          // now lets validate the config validators
          if (didValidate) {
            // error will be emitted by `this._validateConfigValidators()` if needed
            didValidate = this._validateConfigValidators({
              from: from,
              to: to
            }, options);
          }
        } else {
          console.error('The instance method \'setInterval()\' takes and interval object with \'from\' and \'to\' as keys with moment instances');
        }
      } else {
        console.error('The instance method \'setInterval()\' takes and interval object');
      }

      if (!didValidate) {
        return false;
      } else {
        return true;
      }
    },
    _validateMinMax: function _validateMinMax(interval) {
      var _this3 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      // validates according minimum and maximum time set on config
      // emits error event
      var didValidate = true;
      _.each(['from', 'to'], function (calendar) {
        if (_.has(_this3.config.minDate, calendar)) {
          if (interval[calendar].isBefore(_this3.config.minDate[calendar])) {

            if (!options.noEvents) {
              _this3.trigger('validation:error', '`' + calendar.toUpperCase() + '` date should be after ' + _this3.config.minDate[calendar].format('Do MMM'));
            }
            didValidate = false;
          }
        }

        if (_.has(_this3.config.maxDate, calendar)) {
          if (interval[calendar].isAfter(_this3.config.maxDate[calendar])) {
            if (!options.noEvents) {
              _this3.trigger('validation:error', '`' + calendar.toUpperCase() + '` date should be before ' + _this3.config.maxDate[calendar].format('Do MMM'));
            }
            didValidate = false;
          }
        }
      });

      return didValidate;
    },
    _validateConfigValidators: function _validateConfigValidators(interval) {
      var _this4 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      // validates according to the validator function passed in
      // config | also emits error event

      var didValidate = true;
      var from = interval.from;
      var to = interval.to;

      _.every(this.validators, function (validator) {
        var result = validator.call(_this4, from, to);

        if (_.isObject(result) && _.has(result, 'message')) {

          if (!options.noEvents) {
            _this4.trigger('validation:error', result.message);
          }

          didValidate = false;
          return false;
        } else {
          didValidate = true;
          return true;
        }
      });

      return didValidate;
    },
    _setDefaultForTo: function _setDefaultForTo() {
      this.setDate('to', this.getDate('from').add(this.config.defaultInterval, 'days'));
    },
    _setSelectedDateInFooter: function _setSelectedDateInFooter() {
      // this reflect the date interval selected in the download button
      // not in use right now, but can be used if need
      var buttonPrefix = this.config.submitButtonText || 'Download';

      var fromDate = this.getDate('from') && this.getDate('from').format('DD MMM');
      var toDate = this.getDate('to') && this.getDate('to').format('DD MMM');

      if (fromDate && toDate) {
        this.ui.submit.html(buttonPrefix + ' for ' + fromDate + ' to ' + toDate);
      }
    },
    _selectDateFromQuickAction: function _selectDateFromQuickAction(e) {
      e.preventDefault();

      // we get the index of the action relative to its siblings
      // we can do so because we are rendering the actions programatically
      // in that same order
      var action = this.config.quickActions[$(e.target).index()];
      var didSetInterval = this.setInterval(action);

      if (didSetInterval) {
        this.$('.action').removeClass('active');
        $(e.target).addClass('active');
      }
    }
  });
});