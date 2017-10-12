'use strict';

cs142App.controller('UserFavlistController', ['$scope', '$routeParams', '$location', '$resource', '$rootScope',
  function ($scope, $routeParams, $location, $resource, $rootScope) {
    $scope.main.title = 'User Favorites';
    $location.search({'extraFeature':$scope.curStatus.advanced});
    var Detail = $resource('/user/:userId', {userId:'@user_id'});
    var curr_user = Detail.get({userId:$scope.userinfo.userId}, function(){
        $scope.currUser = curr_user;
        $scope.curStatus.status = 'Favorites of ' + $scope.currUser.first_name + ' ' + $scope.currUser.last_name;
    });

    $scope.deleteFavFunc = function(photoID) {
        var deleteFav = $resource('/deleteFavAPI');
        var delFav = deleteFav.save({userId:$scope.userinfo.userId, photoId: photoID}, function() {
            var curr = Detail.get({userId:$scope.userinfo.userId}, function(){
                $scope.currUser = curr;
            });
        });
    };
}]);

