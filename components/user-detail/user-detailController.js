'use strict';

cs142App.controller('UserDetailController', ['$scope', '$routeParams', '$location', '$resource', '$rootScope',
  function ($scope, $routeParams, $location, $resource, $rootScope) {
    $scope.main.title = 'User Details';
    var userId = $routeParams.userId;

    var Detail = $resource('/user/:userId', {userId:'@user_id'});
    var curr_user = Detail.get({userId:userId}, function(){
        $scope.currUser = curr_user;
        $location.search({'extraFeature':$scope.curStatus.advanced});
        $scope.curStatus.status = 'Details of ' + $scope.currUser.first_name + ' ' + $scope.currUser.last_name;
        var atText = '@' + $scope.currUser.first_name + $scope.currUser.last_name;
        var mention = $resource('/mentionListAPI/'+ atText);
        var mentionlist = mention.query({at: atText}, function() {
            $scope.mentionedPhotos = mentionlist;
        });

        var Users = $resource('/user/list');
        var userslist = Users.query({}, function() {
            $scope.userslist = userslist;
            $scope.findUserName = function(userID) {
                for (var i=0; i < $scope.userslist.length; i++) {
                    if ($scope.userslist[i]._id === userID) {
                        return $scope.userslist[i].first_name+' '+$scope.userslist[i].last_name;
                    }
                }
            };
        });
    });
  }]);

