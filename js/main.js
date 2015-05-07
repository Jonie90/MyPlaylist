var app = angular.module('myApp', []);

app.factory('lastfmservice', ['$http', function ($http) {
  var apiKey = '2fc4ae7a761082b6017b90896317d42d';
  var url = 'http://ws.audioscrobbler.com/2.0/';
    
  return {
      findArtists: function (artist) {
      var params = {
        method: 'artist.search',
        artist: artist,
        api_key: apiKey,
        format: 'json',
        autocorrect: 1
      };        
      return $http.get(url, {params: params});
   
      },
      topTracks: function(artist){
        var params = {
        method: 'artist.getTopTracks',
        artist: artist,
        api_key: apiKey,
        format: 'json',
        autocorrect: 1
      };   
      return $http.get(url, {params: params});
      
      }
  };
}]);

//Filter borrowed from mile http://stackoverflow.com/questions/16118762/angularjs-wrong-index-after-orderby
app.filter('index', function () {
    return function (array, index) {
        if (!index)
            index = 'index';
        for (var i = 0; i < array.length; ++i) {
            array[i][index] = i;
        }
        return array;
    };
});

app.controller('MyPlaylistController', ['$scope', '$timeout', '$window','lastfmservice', function($scope, $timeout, $window, lastfmservice) {
  
  window.MY_SCOPE = $scope;
  artists_tracks= "";
  $scope.playlist = [];
  var timeout;
  $scope.showResultContainer = true;
  $scope.showBack = false;
  $scope.show = false;
  $scope.toggle = false;
  $scope.predicate = 'name';
  $scope.ascending = false;
  $scope.ascendingArtists = false;
  $scope.trackHasBeenClicked = true;
  $scope.artistHasBeenClicked = true;

  $scope.search = function(){

    //To avoid searching for an empty string
    if($scope.artist){

      lastfmservice.findArtists($scope.artist)
        .success(function(data) {
          
         // console.log(data);   
          
          $scope.showResultContainer = true;
          //Hide the "go back" arrow
          $scope.showBack = false;
          //Set title in ResultContainer
          $scope.artists_tracks="Artists";
          $scope.tracks = null; 
//          console.log("artists_tracks" + artists_tracks);

          //Width of the screen
          $scope.width = $window.innerWidth;
 //         console.log("window width: " + $scope.width);

          //Check the window width and hide the playlist automatically when typing in the search field if window smaller than 535 (different style for this size)
          if($scope.width < 535){
            $scope.show=false;
          }

          //check if there was an artist match, if not return error message, otherwise insert data into array
          if(typeof data.results.artistmatches !=="undefined"){

            if(data.results.artistmatches == 0){
              $scope.artists = null;
              $scope.requestError = "Sorry, no artists were found";
            }else{
              $scope.requestError = null;

              //Store the data, check if the result was an array, otherwise (if only one object was returned) store the data in an array   
              if(angular.isArray(data.results.artistmatches.artist)){
                    $scope.artists = data.results.artistmatches.artist;
              }else{
                    $scope.artists = [data.results.artistmatches.artist];
              }
            }
          }
      });
    }
  }
  

  $scope.getTracks = function(artist){
    
    lastfmservice.topTracks(artist)
      .success(function(data) {
        //console.log(data);
        //console.log("artist" + artist);
  
        //Set title in ResultContainer
        $scope.artists_tracks="Tracks by " + artist + " ";
        //console.log("artists_tracks " + artists_tracks);
        $scope.artists = null;

        if(data.error ==16){
          $scope.requestError = "Server error";
        }
        else if(data.toptracks.total == "0"){
          $scope.tracks = null;
          $scope.requestError = "Sorry, no tracks were found";
        }else{ //Insert tracks into array
          $scope.requestError = null;
          //Store the data, check if the result was an array, otherwise (if only one object was returned) store the data in an array
          if(angular.isArray(data.toptracks.track)){
            $scope.tracks = data.toptracks.track;
          }else{
            $scope.tracks = [data.toptracks.track];
          }
        }
    });
  }

  $scope.getTracksSearch=function(artist){
    $scope.getTracks(artist);
    //Show the "go back" arrow
    $scope.showBack = true;
  }

  $scope.getTracksPlaylist=function(artist){
    $scope.getTracks(artist);
    //Hide the "go back" arrow
    $scope.showBack = false;
  }

  //Function for checking if a track has already been added to the playlist or not
  $scope.alreadyInPlaylist = function(track){
        //console.log("entered alreadyInPlaylist");
        for(var i=0 ; i < $scope.playlist.length ; i++){
          if(angular.equals($scope.playlist[i], track))   return true;
        }
        return false;
  };

  $scope.addToPlaylist = function(track){
      //console.log("add was clicked");
      if($scope.alreadyInPlaylist(track)){ 
        //console.log("alreadyInPlaylist returned true");
        if(window.confirm(track.name + " by " + track.artist.name + " is already in your playlist, do you want to add it again?")){
          $scope.playlist.push(track);
          $scope.show =true;
          //console.log("Playlist: " + $scope.playlist);
        }
      }else{
        //console.log("alreadyInPlaylist returned false");
        $scope.playlist.push(track);
        //console.log("Playlist: " + $scope.playlist);
        $scope.show =true;
      }

      //Store locally -> possible to reload the page without losing the playlist
      localStorage["playlist"] = JSON.stringify($scope.playlist);
  }

  $scope.removeFromPlaylist = function(index){
    //console.log("remove was clicked, index:" + index);
    $scope.$watch('$scope.remove', function(){

      //Open confrmation window and remove if OK is pressed
      if(window.confirm("Remove "+ $scope.playlist[index].name + " by " + $scope.playlist[index].artist.name + " from playlist?")){
        
        //Get the index and remove that element
        $scope.playlist.splice(index, 1); 
    
        //console.log("Playlist: " + $scope.playlist);

        //Store locally -> possible to reload the page without losing the playlist
        localStorage["playlist"] = JSON.stringify($scope.playlist); 
      }
    });
  }

  //Scroll to function to avoid ending up at the top of the page after clicking a link
  $scope.scrollTo = function(id) {
      var old = $location.hash();
      $location.hash(id);
      $anchorScroll();
      //reset to old to keep any additional routing logic from kicking in
      $location.hash(old);
 //     console.log("I scrolled");
  };

  $scope.showPlaylist= function(){
    $scope.show = !$scope.show;  
    $scope.toggle = !$scope.toggle;
 //   console.log("toggle: " + $scope.toggle);
  };
  $scope.orderByTrack=function(){
 //   console.log("predicate: " + $scope.predicate);
      $scope.predicate = $scope.predicate === 'name' ? '-name' : 'name';
      $scope.ascending = !$scope.ascending;
      $scope.artistHasBeenClicked = false;
      $scope.trackHasBeenClicked = true;
  }
  $scope.orderByArtist=function(){
//    console.log("predicate: " + $scope.predicate);
      $scope.predicate = $scope.predicate === 'artist.name' ? '-artist.name' : 'artist.name';
      $scope.ascendingArtists = !$scope.ascendingArtists;
      $scope.artistHasBeenClicked = true;
      $scope.trackHasBeenClicked = false;

  }

  if (typeof localStorage["playlist"] !== "undefined") {
    //Get playlist from local storage
    $scope.playlist = JSON.parse(localStorage["playlist"]);
  }
    
  // console.log("stored playlist: " + $scope.playlist);

}]);