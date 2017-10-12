'use strict';

cs142App.controller('login-registerController', ['$scope', '$routeParams', '$location', '$resource', '$rootScope',
  function ($scope, $routeParams, $location, $resource, $rootScope) {
    $scope.main.title = 'User Login';
    $scope.loginFunc = function() {
        var userLoggedIn = $resource('/admin/login');
        var loginData = userLoggedIn.save({login_name:$scope.loginName, password: $scope.loginPassword}, function () {
            $rootScope.$broadcast('someOneLoggedIn');
            $location.path("/users/" + loginData._id);
            $scope.userinfo.first_name = loginData.first_name;
            $scope.userinfo.userId = loginData._id;

            // var res = $resource('/user/:userId', {userId:'@id'});
            // var userRes = res.get({userId:$scope.userinfo.userId}, function(){
            //     $scope.userinfo.userFavlist = userRes.favlist;
            // });

            var AllPhotos = $resource('/allPhotos');
            var all_photos = AllPhotos.get(function(){
                $scope.curStatus.countInfo = all_photos;
                $rootScope.noOneIsLoggedIn = false;

            });
            }, function (err){
                alert('Wrong username or password');
                console.log('Wrong username or password');
            });
            
        };

    $scope.registerFunc = function() {
        var userRegister = $resource('/user');
        if ($scope.reg_password !== $scope.reg_passwordConfirm) {
            alert('Passwords are different.');
            return;
        }
        if (!$scope.reg_password || !$scope.reg_loginName) {
            alert('Please enter password and login name');
            return;
        }
        if (!$scope.reg_firstname || !$scope.reg_lastname) {
            alert('First name and Last name are required.');
            return;
        }
        var regUser = userRegister.save({
            first_name: $scope.reg_firstname, // First name of the user.
            last_name: $scope.reg_lastname,  // Last name of the user.
            location: $scope.reg_location,    // Location  of the user.
            description: $scope.reg_description,  // A brief user description
            occupation: $scope.reg_occupation,    // Occupation of the user.
            login_name: $scope.reg_loginName,
            password: $scope.reg_password
        }, function () {
            alert('You are registerd successfully. Please Login');

        }, function(err) {
            alert('Maybe try another login name.');
        });
    };
  }]);