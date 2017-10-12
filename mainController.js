'use strict';

var cs142App = angular.module('cs142App', ['mentio','ngResource','ngRoute', 'ngMaterial']);

cs142App.config(['$routeProvider',
	function ($routeProvider) {
		$routeProvider.
			when('/users', {
				templateUrl: 'components/user-list/user-listTemplate.html',
				controller: 'UserListController'
			}).
			when('/users/:userId', {
				templateUrl: 'components/user-detail/user-detailTemplate.html',
				controller: 'UserDetailController'
			}).
			when('/favorites', {
				templateUrl: 'components/user-favlist/user-favlistTemplate.html',
				controller: 'UserFavlistController'
			}).
			when('/photos/:userId', {
				templateUrl: 'components/user-photos/user-photosTemplate.html',
				controller: 'UserPhotosController'
			}).
			when('/comments/:userId', {
				templateUrl: 'components/user-comments/user-commentsTemplate.html',
				controller: 'UserCommentsController'
			}).
			when('/photos/:userId/:photoId', {
				templateUrl: 'components/user-photos/user-photosTemplate.html',
				controller: 'UserPhotosController'
			}).
			when('/login-register', {
				templateUrl: 'components/login-register/login-registerTemplate.html',
				controller: 'login-registerController'
			}).
            otherwise({
                redirectTo: '/users'
            });
	}]);

cs142App.controller('MainController', ['$scope', '$location', '$resource', '$rootScope', '$http',
	function ($scope, $location, $resource, $rootScope, $http) {
		$scope.main = {};
		$scope.main.title = 'Users';
		$scope.userinfo = {};
		
		$scope.curStatus = {};
		$scope.curStatus.advanced = false;


		$scope.curStatus.advanced = $location.search().extraFeature;
		$location.search('extraFeature',$scope.curStatus.advanced);
		$scope.$watch('curStatus.advanced', function(){
			$location.search('extraFeature',$scope.curStatus.advanced);
		});


        $rootScope.noOneIsLoggedIn = true;
        


		//hadling photo uplode
	    var selectedPhotoFile;   // Holds the last file selected by the user

	    // Called on file selection - we simply save a reference to the file in selectedPhotoFile
	    $scope.inputFileNameChanged = function (element) {
	        selectedPhotoFile = element.files[0];
	    };

	    // Has the user selected a file?
	    $scope.inputFileNameSelected = function () {
	        return !!selectedPhotoFile;
	    };

	    // Upload the photo file selected by the user using a post request to the URL /photos/new
	    $scope.uploadPhoto = function () {
	        if (!$scope.inputFileNameSelected()) {
	            console.error("uploadPhoto called will no selected file");
	            return;
	        }
	        console.log('fileSubmitted', selectedPhotoFile);
	        // Create a DOM form and add the file to it under the name uploadedphoto
	        var domForm = new FormData();
	        domForm.append('uploadedphoto', selectedPhotoFile);
	        // Using $http to POST the form
	        $http.post('/photos/new', domForm, {
	            transformRequest: angular.identity,
	            headers: {'Content-Type': undefined}
	        }).success(function(newPhoto){
	        	$rootScope.$broadcast('photoIsAdded');
	        }).error(function(err){
	            console.error('ERROR uploading photo', err);
	        });
	    };
	    $scope.deleteAccountFunc = function(userID) { 
	    	var conf = confirm('Are you sure to delete this account?');
	    	if (!conf) {
	    		return;
	    	}
	    	var accountDelete = $resource('/deleteAccountAPI');
	    	var deleteAcct = accountDelete.save({userId:userID}, function(){
	    		$scope.logoutFunc();
	    	}, function(err){
	    	});
	    };

        $scope.logoutFunc = function() {
        	$rootScope.noOneIsLoggedIn = true;
	    	$location.path("/login-register");

	        var userLoggedOut = $resource('/admin/logout');
        	var logoutData = userLoggedOut.save();

        };
        
        $rootScope.$on('someOneLoggedIn', function () {
        	$rootScope.noOneIsLoggedIn = false;
        });

        var checkLogin = $resource('/checkLogin');
		var check = checkLogin.save({}, function() {
			if(check && check.login_name) {
	        	$rootScope.noOneIsLoggedIn = false;
	        	$scope.userinfo.userId = check._id;
				$scope.userinfo.first_name = check.first_name;

				var AllPhotos = $resource('/allPhotos');
		        var all_photos = AllPhotos.get(function(){
					$scope.curStatus.countInfo = all_photos;
				});
			} else {
	        	$rootScope.noOneIsLoggedIn = true;
				$location.path("/login-register");
			}
		 	$rootScope.$on( "$routeChangeStart", function(event, next, current) {
				if ($rootScope.noOneIsLoggedIn) {
					if (next.templateUrl !== "components/login-register/login-registerTemplate.html") {
					    $location.path("/login-register");
					}
				}
			});

		}, function(err) {
		    console.log(err);
		});
	}]);

