'use strict';

cs142App.controller('UserListController', ['$scope', '$location', '$resource', '$rootScope',
    function ($scope, $location, $resource, $rootScope) {
        $scope.main.title = 'Users';

        $scope.$on('commentIsAdded', function() {
        	var AllPhotos = $resource('/allPhotos');
	        var all_photos = AllPhotos.get(function(){
				$scope.curStatus.countInfo = all_photos;
			});
        });

        $scope.$on('commentIsDeleted', function() {
            var AllPhotos = $resource('/allPhotos');
            var all_photos = AllPhotos.get(function(){
                $scope.curStatus.countInfo = all_photos;
            });
        });
        $scope.$on('photoIsAdded', function() {
        	var AllPhotos = $resource('/allPhotos');
	        var all_photos = AllPhotos.get(function(){
				$scope.curStatus.countInfo = all_photos;
			});
        });

        $scope.$on('photoIsDeleted', function() {
            var AllPhotos = $resource('/allPhotos');
            var all_photos = AllPhotos.get(function(){
                $scope.curStatus.countInfo = all_photos;
            });
        });

        var Users = $resource('/user/list');
        $scope.usersList = Users.query();
        $scope.curStatus.status = "Users List";
    }]);

