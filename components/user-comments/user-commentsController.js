'use strict';

cs142App.controller('UserCommentsController', ['$scope', '$routeParams', '$location', '$resource', '$rootScope',
  function ($scope, $routeParams, $location, $resource, $rootScope) {
    $scope.main.title = 'User Comments';
    var userId = $routeParams.userId;
    $location.search({'extraFeature':$scope.curStatus.advanced});
    var AllPhotos = $resource('/allPhotos');
    var all_photos = AllPhotos.get(function(){
        $scope.curStatus.countInfo = all_photos;
        if ($scope.curStatus.countInfo && $scope.curStatus.countInfo[userId]) {
            $scope.currComments = $scope.curStatus.countInfo[userId].commentsArray;
        }
    });
    
    var Detail = $resource('/user/:userId', {userId:'@user_id'});
    var curr_user = Detail.get({userId:userId}, function(){
        $scope.curStatus.status = 'Comments written by ' + curr_user.first_name + ' ' + curr_user.last_name;
    });
  }]);

