export default Thorax.View.extend({
  initialize: function () {
    // reference to the 'from' and 'to' calendar
    this.calendars = {};
    // all validators given by user inside config when
    // instantiating the view
    this.validators = [];

    // add the validators passed inside the config
    if (_.has(this.config, 'validators')) {
      const config = this.config;
      for (let validator in config.validators) {
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
    _.each(this.config.quickActions, (action) => {
      if (!this._validateInterval(action, {noEvents: true})) {
        _.tap(action, () => action.disabled = true);
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
    rendered () {
      const self = this;

      this.ui = {
        'submit': this.$('.submit-button')
      }
      this._initCalendars();
    },
    'change:date': function (changeObj) {
      // event handler whenever a date changes on any of the calendars
      const didValidate = this._validate();
      if (didValidate) {
        // the `to` date cannot be earlier than `from`
        if (changeObj.calendar === 'from' ) {
          this.getCalendar('to').minDate(this.getDate('from'));
        }
      }
    },
    'validation:error': function (error) {
      console.error(error);
    },
    'click .action': '_selectDateFromQuickAction'
  },
  getCalendar (calendar) {
    // this is a constraint of the bootstrap date time library
    // All functions are accessed via the data attribute e.g.
    //  $('#datetimepicker').data("DateTimePicker").FUNCTION()
    // hence this is sugar method to avoid the extra code
    // and its essential to API of date-interval
    return this.calendars[calendar].data('DateTimePicker');
  },
  getDate (calendar) {
    return (this.getCalendar(calendar)).date()
  },
  setDate (calendar, date) {
    if (!moment.isMoment(date)) {
      console.error('Date must be an instance of moment');
    }

    (this.getCalendar(calendar)).date(date);
  },
  getInterval () {
    return {
      from: this.getDate('from'),
      to: this.getDate('to')
    }
  },
  setInterval(intervalObj) {
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
  _initCalendars () {
    _.each(['from', 'to'], (calendar) => {
      const minDate = _.has(this.config, 'minDate') ? this.config.minDate[calendar] : undefined;

      const maxDate = _.has(this.config, 'maxDate') ? this.config.maxDate[calendar] : undefined;

      const useCurrent = this.config.useCurrent;

      this.calendars[calendar] = this.$(`#${calendar}`).datetimepicker({
        inline: true,
        format: 'DD/MM/YYYY',
        minDate,
        maxDate,
        useCurrent
      });

      this._registerDateChangeEvent(calendar);
    });
  },
  _registerDateChangeEvent (calendar) {
    // hooking into the date-picker's date change event and
    // and we augment the information of which calendar fired the event
    const self = this;
    this.calendars[calendar].on('dp.change', function (changeEvent) {
      const newDate = changeEvent.date;
      const oldDate = changeEvent.oldDate;
      self.trigger('change:date', {
        calendar,
        newDate,
        oldDate
      });
    });
  },
  _addvalidators (validator) {
    this.validators.push(validator);
  },
  _validate () {
    // this only validates date selected(clicked) by user, so in essence, it
    //  always get either a `from` or `to` but not the interval
    const self = this;
    let didValidate, from, to;

    // okay, we need to clone these moment instances otherwise
    // the source(config.quickActions) getting passed, will get mutated
    // by the validator function
    from = self.getDate('from').clone();
    to = self.getDate('to').clone();

    // no need to validate min and max date as they can't be
    // selected by users
    didValidate = this._validateConfigValidators({
      from,
      to
    })

    return didValidate;
  },

  _validateInterval (interval, options) {
    // only used when the interval is getting saved programatically
    // i.e not on user clicks on individual calendar dates
    let didValidate, from, to;

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
          from,
          to
        }, options);

        // now lets validate the config validators
        if (didValidate) {
          // error will be emitted by `this._validateConfigValidators()` if needed
          didValidate = this._validateConfigValidators({
            from,
            to
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

  _validateMinMax (interval, options = {}) {
    // validates according minimum and maximum time set on config
    // emits error event
    let didValidate = true;
    _.each(['from', 'to'], (calendar) => {
      if (_.has(this.config.minDate, calendar)) {
        if (interval[calendar].isBefore(this.config.minDate[calendar])) {

          if (!options.noEvents) {
            this.trigger('validation:error', `\`${calendar.toUpperCase()}\` date should be after ${this.config.minDate[calendar].format('Do MMM')}`);
          }
          didValidate = false;
        }
      }

      if (_.has(this.config.maxDate, calendar)) {
        if (interval[calendar].isAfter(this.config.maxDate[calendar])) {
          if (!options.noEvents) {
            this.trigger('validation:error', `\`${calendar.toUpperCase()}\` date should be before ${this.config.maxDate[calendar].format('Do MMM')}`);
          }
          didValidate = false;
        }
      }
    });

    return didValidate;
  },
  _validateConfigValidators (interval, options = {}) {
    // validates according to the validator function passed in
    // config | also emits error event

    let didValidate = true;
    const {from, to} = interval;

    _.every(this.validators, (validator) => {
      let result = validator.call(this, from, to);

      if (_.isObject(result) && _.has(result, 'message')){

        if (!options.noEvents) {
          this.trigger('validation:error', result.message);
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
  _validateFromBeforeToAlways (from, to) {
    // `from` date should always be before `to`
    if (to.isAfter(from) || to.isSame(from)) {
      return true;
    } else {
      return {
        message: `The 'from' date should always be before 'to' date`
      }
    }
  },
  _setDefaultForTo () {
     this.setDate('to', this.getDate('from').add(this.config.defaultInterval, 'days'));
  },
  _setSelectedDateInFooter () {
    // this reflect the date interval selected in the download button
    // not in use right now, but can be used if need
    const buttonPrefix = this.config.submitButtonText || 'Download';


    const fromDate = this.getDate('from') && this.getDate('from').format('DD MMM');
    const toDate = this.getDate('to') && this.getDate('to').format('DD MMM');

    if (fromDate && toDate) {
      this.ui.submit.html(`${buttonPrefix} for ${fromDate} to ${toDate}`)
    }
  },

  _selectDateFromQuickAction (e) {
    e.preventDefault();

    // we get the index of the action relative to its siblings
    // we can do so because we are rendering the actions programatically
    // in that same order
    const action = this.config.quickActions[$(e.target).index()];
    const didSetInterval = this.setInterval(action);

    if (didSetInterval) {
      this.$('.action').removeClass('active');
      $(e.target).addClass('active');
    }
  }
});
