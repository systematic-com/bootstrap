angular.module('ui.bootstrap.demo').controller('DropdownCtrl', function ($scope) {
  $scope.items = [
    'The first choice!',
    'And another choice for you.',
    'but wait! A third!'
  ];

  $scope.status = {
    isopen: false
  };

  $scope.toggled = function(open) {
    console.log('Dropdown is now: ', open);
  };

  $scope.toggleDropdown = function($event) {
    $event.preventDefault();
    $event.stopPropagation();
    $scope.status.isopen = !$scope.status.isopen;
  };
})

.directive('contextMenuToggle', function () {
  return {
    require: '^dropdown',
    link: function (scope, element, attrs, dropdownCtrl) {
      element.bind('contextmenu', function (evt) {
        scope.$apply(function () {
          console.log('context menu right clicked');
          evt.preventDefault();
          evt.stopPropagation();
          dropdownCtrl.toggle(true, evt);
        });
      });
    }
  };
});
