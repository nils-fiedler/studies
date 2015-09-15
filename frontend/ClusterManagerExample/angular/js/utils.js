"use strict";
var ClusterManager = ClusterManager || {};
ClusterManager.Utils = ClusterManager.Utils || {};

/* Helper functions */
(function() {
  /** Returns the first available server running maximal 1 app */
 this.getAvailableServer = function(servers) {
    if(servers && servers.length) {
      var i, l = servers.length;
      // return first server index running 0 app instances
      for(i = 0; i < l; ++i) {
        if (servers[i].apps.length == 0) { return i; }
      }
      // return first server index running 1 app instance
      for(i = 0; i < l; ++i) {
        if (servers[i].apps.length == 1) { return i; }
      }
    }
    return -1;
  };
  
  /** Returns the indices of the newest instance for given appType */
 this.getNewestAppInstance = function(servers, appType) {
    if(servers && servers.length && appType) {
      var serverIndex = -1;
      var appIndex = -1;
      // iterate through servers
      for(var i = 0, l = servers.length; i < l; ++i) {
        // iterate over app instances on each server
        for(var j = 0, m = servers[i].apps.length; j < m; ++j) {
          // check for given appType
          if(servers[i].apps[j].appId == appType.id) {
            // set indices for first server running an instance of appType
            // then check for newer instance
            if(serverIndex == -1 ||
                servers[i].apps[j].startTime >= servers[serverIndex].apps[appIndex].startTime) {
              serverIndex = i;
              appIndex = j;
            }
          }
        }
      }
      if(serverIndex != -1 && appIndex != -1) {
        return { "serverIndex": serverIndex, "appIndex": appIndex };
      }
    }
    return -1;
  };
}).apply(ClusterManager.Utils);