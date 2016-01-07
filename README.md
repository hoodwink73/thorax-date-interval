# thorax-date-interval
This repo offers a thorax view which can used to select a **date interval**.

It builds on a [bootstrap 3 datepicker library](http://eonasdan.github.io/bootstrap-datetimepicker/)

## Config
When instantiating a view, a `config` object can be passed into the `extend` method

`config.validators` -  a object of functions to validate allowed date intervals and
`defaultInterval` -  automatically select the 'to' date if `from` date is selected
`minDate` - the earliest date that can be selected by the user
`maxDate` - the latest date that can be selected by the user

``` javascript
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
      shouldBeAWeekApart (from, to) {
        if (to.isSameOrAfter(from.add(7, 'days'))) {
          return true;
        } else {
          return {
            message: `Minimum interval between the selected dates should be at
                      least seven days`
          }
        }
      }
    },
    minDate: {
      from: moment().subtract(7, 'days')
    },
    submitButtonText: 'Download Report'
  }
}).render();
```
## Events

### change:date
Whenever a user selects date, this event will get fired. The handler will be passed a change object, which will tell the which calendar emitted the event (from or to), the new date and the old date

### validation:error
When the selected date cannot be validated by the validators. This event can be handled to show error messages.

## Usage
```
npm install
bower install
npm start
```

We are `webpack-dev-server` for development

So, head to `localhost:3000` to get started.

## Already Running

-  **Hot Replacement Module** - Change any line of code in any `.js` file in `src` directory or any `.scss` file in `sass` directory (include the sass module in `main.scss`), the browser will update the app.

-  Sass is getting pre-compiled for you using webpack-loaders

-  `.js` in `src` can be written in ES2015 and it will get compiled by webpack loaders

-  `Thorax` is available as a global. Every module created will get `$`, `_`, `Handlebars` and `Backbone` as dependency injection.

-  Linting can be done by `eslint src` provided `eslint`. You can get it to support in Sublime Text and Atom.
