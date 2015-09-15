"use strict";
var ClusterManager = ClusterManager || {};

/* Class constructors */
(function() {
  this.Server = function(apps, creationDate) {
    this.apps = apps ? apps : [];
    this.creationDate = creationDate ? creationDate : new Date();
  };
  
  this.AvailableApp = function(id, title, tag) {
    this.id = id;
    this.title = title;
    this.tag = tag;
  };
}).apply(ClusterManager);

/* Global angular app */
var clusterManagerApp = angular.module("clusterManagerApp", []);

/* Main controller for managing servers and app instances */
clusterManagerApp.controller("clusterManagerCtrl", ["$scope", "$interval", "$http",
  function($scope, $interval, $http) {
    /* ultimately one would use a server-request to fetch the servers 
     * and available applications
     * $http.get("json/apps.json").success(function(data) {
     *   $scope.availableApps = data;
     * });
     * $http.get("json/servers.json").success(function(data) {
     *  $scope.servers = data;
     * });
     */
    $scope.availableApps = ClusterManager.Mock.getAvailableApps();
    $scope.servers = ClusterManager.Mock.getServers();
    
    /** Add a new server to the canvas */
    $scope.addServer = function() {
      $scope.servers.push(new ClusterManager.Server());
    };
    
    /** Destroy a server at the given index or the last server if no serverIndex is specified */
    $scope.destroyServer = function(serverIndex) {
      if($scope.servers.length > 0) {
        serverIndex = (serverIndex != undefined) ? serverIndex : $scope.servers.length - 1;
        var serverToBeDestroyed = $scope.servers.splice(serverIndex, 1);
        // move all instances of running appliactions to another server
        for(var i = 0, l = serverToBeDestroyed[0].apps.length; i < l; ++i) {
          $scope.startApp(serverToBeDestroyed[0].apps[i].appId);
        }
      }
    };
    
    /** Start an instacne of the given app type */
    $scope.startApp = function(appToStart) {
      var availableServer = ClusterManager.Utils.getAvailableServer($scope.servers);
      if(availableServer != -1) {
        $scope.servers[availableServer].apps.push({"appId": appToStart, "startTime": new Date().getTime()});
      }
      // TODO: no server available for new instance
    };
    
    /** Kill latest/newest instance of the given app type */
    $scope.killApp = function(appToKill) {
      var newestAppInstance = ClusterManager.Utils.getNewestAppInstance($scope.servers, appToKill);
      if(newestAppInstance != -1) {
        $scope.servers[newestAppInstance.serverIndex].apps.splice(newestAppInstance.appIndex, 1);
      }
    };
    
    /** Frequently update the date object used for showing server and instance up-times */
    $scope.date = new Date().getTime();
    $interval(function() {
      $scope.date = new Date().getTime();
    }, 1000);
}])
/* Filter for refreshing running times */
.filter("refreshRunningTimes", function() {
  return function(timestamp, date) {
    var millisAgo = date - timestamp;
	// return as days
    if(millisAgo >= 24*60*60*1000) {
      return parseInt(millisAgo / (24*60*60*1000)) + " d";
    }
	// return as hours
    else if(millisAgo >= 60*60*1000) {
      return parseInt(millisAgo / (60*60*1000)) + " h";
    }
	// return as minutes
    else if(millisAgo >= 60*1000) {
      return parseInt(millisAgo / (60*1000)) + " min";
    }
	// defaults to seconds
    else {
      return parseInt(millisAgo / 1000) + " sec";
    }
  };
});
