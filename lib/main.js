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
      var name = 'font.name-list.' + n3 + '.' + n4;

      // Start with fonts from prefer locale.
      var values =
        preferPrefValues['font.name-list.' + n3 + '.' + preferLocale].split(',');

      // Append the list with the locale-specific font.
      if (n4 !== preferLocale) {
        prefService.reset(name);
        values = values.concat(prefService.get(name).split(','));
      }

      // Remove duplicate font names in the list.
      var uniqueValues = [];
      values.forEach(function(fontName, i) {
        if (uniqueValues.indexOf(fontName) !== -1) {
          return;
        }

        uniqueValues.push(fontName);

        // Tweak for Mac #1:
        // "LiSong Pro" does not have enough glyph count to
        // cover Simplified Chinese. It must accompany by "STSong" if it's not
        // already present in the list.
        if (fontName === 'LiSong Pro' && values.indexOf('STSong') === -1) {
          uniqueValues.push('STSong');
        }
      });
      values = uniqueValues;

      // Tweak for Mac #2:
      // if we are dealing with serif,
      // font names with "Sung" or "Song" should come before "Hei"
      if (n3 === 'serif') {
        values.sort(function(a, b) {
          if (/S[ou]ng/i.test(a) && /Hei/i.test(b))
            return -1;

          if (/S[ou]ng/i.test(b) && /Hei/i.test(a))
            return 1;

          return 0;
        });
      }

      prefService.set(name, values.join(','));
    });
  });
};

new ZhFontTweak();
