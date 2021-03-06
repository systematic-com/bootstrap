angular.module('ui.bootstrap.dropdown', [])

.constant('dropdownConfig', {
  openClass: 'open'
})

.service('dropdownService', ['$document', function($document) {
  var openScope = null;

  this.open = function( dropdownScope ) {
    if ( !openScope ) {
      $document.bind('click', closeDropdown);
      $document.bind('keydown', escapeKeyBind);
    }

    if ( openScope && openScope !== dropdownScope ) {
        openScope.isOpen = false;
    }

    openScope = dropdownScope;
  };

  this.close = function( dropdownScope ) {
    if ( openScope === dropdownScope ) {
      openScope = null;
      $document.unbind('click', closeDropdown);
      $document.unbind('keydown', escapeKeyBind);
    }
  };

  var closeDropdown = function( evt ) {
    var toggleElement = openScope.getToggleElement();
    if ( evt && toggleElement && toggleElement[0].contains(evt.target) ) {
        return;
    }

    openScope.$apply(function() {
      openScope.isOpen = false;
    });
  };

  var escapeKeyBind = function( evt ) {
    if ( evt.which === 27 ) {
      openScope.focusToggleElement();
      closeDropdown();
    }
  };
}])

.controller('DropdownController', ['$scope', '$attrs', '$parse', 'dropdownConfig', 'dropdownService', '$animate', function($scope, $attrs, $parse, dropdownConfig, dropdownService, $animate) {
  var self = this,
      scope = $scope.$new(), // create a child scope so we are not polluting original one
      openClass = dropdownConfig.openClass,
      getIsOpen,
      setIsOpen = angular.noop,
      toggleInvoker = $attrs.onToggle ? $parse($attrs.onToggle) : angular.noop,
      callbacks = [];

  this.init = function( element ) {
    self.$element = element;

    if ( $attrs.isOpen ) {
      getIsOpen = $parse($attrs.isOpen);
      setIsOpen = getIsOpen.assign;

      $scope.$watch(getIsOpen, function(value) {
        scope.isOpen = !!value;
      });
    }
  };

  this.register = function ( callback ) {
    if (callback) {
      callbacks.push(callback);
    }
  };

  this.unregister = function ( callback ) {
    if (callback && callbacks.indexOf(callback) > -1) {
      callbacks.splice(callbacks.indexOf(callback), 1);
    }
  };

  this.toggle = function( open, event ) {
    var isOpen = arguments.length ? !!open : !scope.isOpen;
    if (isOpen) {
      callbacks.forEach(function (cb) {
        cb(event ? {x: event.pageX, y: event.pageY } : undefined);
      });
    }
    return scope.isOpen = isOpen;
  };


  // Allow other directives to watch status
  this.isOpen = function() {
    return scope.isOpen;
  };

  scope.getToggleElement = function() {
    return self.toggleElement;
  };

  scope.focusToggleElement = function() {
    if ( self.toggleElement ) {
      self.toggleElement[0].focus();
    }
  };

  scope.$watch('isOpen', function( isOpen, wasOpen ) {
    $animate[isOpen ? 'addClass' : 'removeClass'](self.$element, openClass);

    if ( isOpen ) {
      scope.focusToggleElement();
      dropdownService.open( scope );
    } else {
      dropdownService.close( scope );
    }

    setIsOpen($scope, isOpen);
    if (angular.isDefined(isOpen) && isOpen !== wasOpen) {
      toggleInvoker($scope, { open: !!isOpen });
    }
  });

  $scope.$on('$locationChangeSuccess', function() {
    scope.isOpen = false;
  });

  $scope.$on('$destroy', function() {
    scope.$destroy();
  });
}])

.directive('dropdown', function() {
  return {
    restrict: 'CA',
    controller: 'DropdownController',
    link: function(scope, element, attrs, dropdownCtrl) {
      dropdownCtrl.init( element );
    }
  };
})

.directive('dropdownToggle', function() {
  return {
    restrict: 'CA',
    require: '?^dropdown',
    link: function(scope, element, attrs, dropdownCtrl) {
      if ( !dropdownCtrl ) {
        return;
      }

      dropdownCtrl.toggleElement = element;

      var toggleDropdown = function(event) {
        event.preventDefault();
        event.stopPropagation();

        if ( !element.hasClass('disabled') && !attrs.disabled ) {
          scope.$apply(function() {
            dropdownCtrl.toggle();
          });
        }
      };

      element.bind('click', toggleDropdown);

      // WAI-ARIA
      element.attr({ 'aria-haspopup': true, 'aria-expanded': false });
      scope.$watch(dropdownCtrl.isOpen, function( isOpen ) {
        element.attr('aria-expanded', !!isOpen);
      });

      scope.$on('$destroy', function() {
        element.unbind('click', toggleDropdown);
      });
    }
  };
})

.directive('dropdownMenu', ['$document', '$timeout', function ($document, $timeout) {
  return {
    restrict: 'AC',
    require: '?^dropdown',
    link: function (scope, element, attrs, dropdownCtrl) {
      if (!dropdownCtrl) {
        return;
      }
      dropdownCtrl.register(onOpen);
      function onOpen(coords) {
        if (!coords) {
          return;
        }
        // Hide it before moving it in to the right place
        element.css('display', 'none');
        // Needs to be done in a timeout, otherwise it is not visible and thus has no width/height
        $timeout(function () {
          element.css('display', 'block');
          element.css('right', 'initial'); // for rtl support
          var doc = $document[0].documentElement,
            docLeft = (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0),
            docTop = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0),
            elementHeight = element[0].scrollHeight,
            elementWidth = element[0].scrollWidth,
            docHeight = doc.clientHeight + docTop,
            docWidth = doc.clientWidth + docLeft,
            totalHeight = elementHeight + coords.y,
            totalWidth = elementWidth + coords.x,
            top = Math.max(coords.y - docTop, 0),
            left = Math.max(coords.x - docLeft, 0);

          if (totalHeight > docHeight) {
            top = top - (totalHeight - docHeight);
          }
          if (totalWidth > docWidth) {
            left = left - (totalWidth - docWidth);
          }
          element.css('position', 'fixed');
          element.css('top', top + 'px');
          element.css('left', left + 'px');
        });
      }

      scope.$on('$destroy', function () {
        dropdownCtrl.unregister(onOpen);
      });
    }
  };
}]);
