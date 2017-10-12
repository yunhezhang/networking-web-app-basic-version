'use strict';

cs142App.controller('UserPhotosController', ['$scope', '$routeParams', '$location','$resource', '$rootScope',
  function($scope, $routeParams, $location, $resource, $rootScope) {
    $scope.main.title = 'User Photo';
    var userId = $routeParams.userId;
    var photoId = $routeParams.photoId;
    $scope.commentInput = {};

    //update the status information
    var Detail = $resource('/user/:userId', {userId:'@id'});
    var curr_user = Detail.get({userId:$routeParams.userId}, function(){
        $scope.currUser = curr_user;
        $scope.curStatus.status = 'Photos of ' + $scope.currUser.first_name+' '+$scope.currUser.last_name;
        
    });

    var Photos = $resource('/photosOfUser/:userId', {userId:'@id'});
    var user_photos = Photos.query({userId:$routeParams.userId}, function(){
        $scope.curUserPhotos = user_photos;
        $location.search('extraFeature',$scope.curStatus.advanced);
        var photoIndex;
        $scope.people = [];
        var photosNum = $scope.curUserPhotos.length;

        var res = $resource('/user/:userId', {userId:'@id'});
        var userRes = res.get({userId:$scope.userinfo.userId}, function(){
            $scope.userinfo.userFavlist = userRes.favlist;
            $scope.checkFav = function(photoID) {
                var found = $scope.userinfo.userFavlist.filter(function (item) {
                    return item._id === photoID;
                });
                if (found[0]) {
                    return true;
                } else {
                    return false;
                }
            };
        });


        var Users = $resource('/user/list');
        var userslist = Users.query({}, function() {
            $scope.usersList = userslist;
            $scope.people = [];
            for (var i=0; i < $scope.usersList.length; i++) {
                var personObj = {};
                personObj.userId = $scope.usersList[i]._id;
                personObj.label = $scope.usersList[i].first_name + ' '+$scope.usersList[i].last_name;
                $scope.people.push(personObj);
            }
        });

        $scope.nameShown = function (text) {
            var ret = text.label.replace(/\s+/g, '');
            return '@'+ret;
        };

        $scope.favFunc = function(photoID) {

            var fav = $resource('/favoriteAPI');
            var favourite = fav.save({photoId: photoID, userId: $scope.userinfo.userId}, function(){
                var res = $resource('/user/:userId', {userId:'@id'});
                var userRes = res.get({userId:$scope.userinfo.userId}, function(){
                    $scope.userinfo.userFavlist = userRes.favlist;
                });
            });

        };

        $scope.checkLiked = function(people) {
            var exist = people.filter(function(person) {
                return person.user_id === $scope.userinfo.userId;
            });
            if (exist[0]) {

                return true;
            } else {
                return false;
            }
        };

        $scope.likeFunc = function(photoID) {
            var like = $resource('/likeAPI');
            var likePhoto = like.save({photoId: photoID, userId: $scope.userinfo.userId}, function() {
                var userPhotos = Photos.query({userId:$routeParams.userId}, function() {
                    $scope.curUserPhotos = userPhotos;
                    if ($scope.curStatus.advanced === true) {
                        $scope.photo = $scope.curUserPhotos[photoIndex];
                    }
                });
            });
        };

        $scope.deletePhotoFunc = function (photoID) {
            var phoDelete = $resource('/deletePhotoAPI');
            var deletePhoto = phoDelete.save({userId: $scope.userinfo.userId, photoId: photoID}, function() {
                var userPhotos = Photos.query({userId:$routeParams.userId}, function() {
                    $scope.curUserPhotos = userPhotos;
                    $rootScope.$broadcast('photoIsDeleted');

                    if ($scope.curStatus.advanced === true) {
                        photosNum --;
                        if (photosNum > 0) {
                            if (photosNum === photoIndex) {
                                photoIndex --;
                            }
                            $scope.photo = $scope.curUserPhotos[photoIndex];
                            if (photoIndex <= 0){
                                $scope.prevButton = false;
                            } 
                            if (photoIndex >= photosNum-1) {
                                $scope.nextButton = false;
                            } 
                        } else {
                            $scope.photo = undefined;
                        }
                    }
                });
            }, function(err) {
                console.log('err');
            });
        };

        $scope.deleteCommentFunc= function(photoID, commentID) {
            var comDelete = $resource('/deleteCommentAPI');

            var deleteCommment = comDelete.save({userId: $scope.userinfo.userId, photoId: photoID, commentId:commentID}, function() {
                $rootScope.$broadcast('commentIsDeleted');
                var userPhotos = Photos.query({userId:$routeParams.userId}, function() {
                    $scope.curUserPhotos = userPhotos;
                    if ($scope.curStatus.advanced === true) {
                        $scope.photo = $scope.curUserPhotos[photoIndex];
                    }
                });
            }, function(err) {

            });

        };

        //function to handle comment submission
        $scope.submitComment = function(photoId) {
            var newComment = $resource('/commentsOfPhoto/'+photoId);
            var newCom = newComment.save({comment:$scope.commentInput[photoId]}, function () {
                $scope.commentInput[photoId] = '';
                $rootScope.$broadcast('commentIsAdded');
                var userPhotos = Photos.query({userId:$routeParams.userId}, function() {
                    $scope.curUserPhotos = userPhotos;
                    if ($scope.curStatus.advanced === true) {
                        $scope.photo = $scope.curUserPhotos[photoIndex];
                    }
                });
            }, function(err) {
                console.log('Please enter comment before submitting');
            });
        };

        //update the model when a photo has been added
        $scope.$on('photoIsAdded', function() {
            var userphotos = Photos.query({userId:$routeParams.userId}, function() {
                $scope.curUserPhotos = userphotos;
                if ($scope.curStatus.advanced === true) {
                    if (!photoIndex) {
                        photoIndex = 0;
                    }

                    photosNum = $scope.curUserPhotos.length;
                    $scope.photo = $scope.curUserPhotos[photoIndex];
                    if (photoIndex < photosNum-1) {
                        $scope.nextButton = true;
                    } 
                }
            });
        });

        //define model data
        if (photosNum === 0) {
            $scope.prevButton = false;
            $scope.nextButton = false;
            // alert("This user does not have a photo yet.");
            // $location.path('/users/'+userId).search({'extraFeature':$scope.curStatus.advanced});          
        } else if ($scope.curStatus.advanced === true) {
            var photoId = $routeParams.photoId? $routeParams.photoId:$scope.curUserPhotos[0]._id;
            $location.path('/photos/'+userId+'/'+ photoId).search('extraFeature',$scope.curStatus.advanced);
            photoIndex = 0;

            for (var i=0; i<photosNum; i++) {
                if ($scope.curUserPhotos[i]._id === photoId) {
                    photoIndex = i;
                }
            }

            $scope.photo = $scope.curUserPhotos[photoIndex];

            //define button functions
            $scope.prev = function() {
                if (photoIndex > 0) {
                    photoIndex --;
                }
                $location.path('/photos/'+userId+'/'+ $scope.curUserPhotos[photoIndex]._id).search('extraFeature',$scope.curStatus.advanced);
                $scope.photo = $scope.curUserPhotos[photoIndex];
            };
            $scope.next = function() {
                if (photoIndex < photosNum-1){
                    photoIndex ++;
                }
                $location.path('/photos/'+userId+'/'+ $scope.curUserPhotos[photoIndex]._id).search('extraFeature',$scope.curStatus.advanced);
                $scope.photo = $scope.curUserPhotos[photoIndex];
            };

            //check if prev and next button are avaliable 
            if (photoIndex <= 0){
                $scope.prevButton = false;
            } 
            if (photoIndex >= photosNum-1) {
                $scope.nextButton = false;
            } 
        }
    });      
}]);
