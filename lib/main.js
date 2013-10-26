'use strict';

var _ = require('sdk/l10n').get;

var ZhFontTweak = function ZhFontTweak() {
  this.prefService = require('sdk/preferences/service');
  this.simplePrefs = require('sdk/simple-prefs');

  this.simplePrefs.on(
    this.OVERWRITE_PREF_NAME, this.updateFontSettings.bind(this));

  this.updateFontSettings();
};
ZhFontTweak.prototype.OVERWRITE_PREF_NAME = 'general_font_overwrite';
ZhFontTweak.prototype.updateFontSettings = function updateFontSettings() {
  var prefValue = this.simplePrefs.prefs[this.OVERWRITE_PREF_NAME];
  var prefService = this.prefService;
  var preferLocale;

  switch (prefValue) {
    case 'automatic':
      preferLocale = _('prefer_locale');

      if (['zh-CN', 'zh-HK', 'zh-TW'].indexOf(preferLocale) === -1) {
        // Not supported.
        preferLocale = undefined;
      }

      break;
    case 'zh-CN':
    case 'zh-HK':
    case 'zh-TW':
      preferLocale = prefValue;

      break;

    case 'off':
      // Reset everything.
      ['name', 'name-list'].forEach(function(n2) {
        ['serif', 'sans-serif', 'monospace'].forEach(function(n3) {
          ['x-western', 'x-unicode', 'zh-CN', 'zh-HK', 'zh-TW'].forEach(function(n4) {
            prefService.reset('font.' + n2 + '.' + n3 + '.' + n4);
          });
        });
      });

      break;
  }

  if (!preferLocale)
    return;

  // Reset values of our own locale, and get their values
  var preferPrefValues = {};
  ['name', 'name-list'].forEach(function(n2) {
    ['serif', 'sans-serif', 'monospace'].forEach(function(n3) {
      var name = 'font.' + n2 + '.' + n3 + '.' + preferLocale;
      prefService.reset(name);
      preferPrefValues[name] = prefService.get(name);
    });
  });

  // Overwrite font.name.* values
  ['serif', 'sans-serif', 'monospace'].forEach(function(n3) {
    ['zh-CN', 'zh-HK', 'zh-TW'].forEach(function(n4) {
      if (n4 === preferLocale)
        return;

      prefService.set(
        'font.name.' + n3 + '.' + n4,
        preferPrefValues['font.name.' + n3 + '.' + preferLocale]);
    });
  });

  // Overwrite font.name-list.* values; append their font list after ours.
  ['serif', 'sans-serif', 'monospace'].forEach(function(n3) {
    ['x-western', 'x-unicode', 'zh-CN', 'zh-HK', 'zh-TW'].forEach(function(n4) {
      if (n4 === preferLocale)
        return;

      var name = 'font.name-list.' + n3 + '.' + n4;
      prefService.reset(name);
      var value = prefService.get(name);

      prefService.set(name,
        preferPrefValues['font.name-list.' + n3 + '.' + preferLocale] + ',' +
        value);
    });
  });
};

new ZhFontTweak();
