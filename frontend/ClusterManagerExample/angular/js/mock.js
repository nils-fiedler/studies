"use strict";
var ClusterManager = ClusterManager || {};
ClusterManager.Mock = ClusterManager.Mock || {};

/* Mock service for servers and available applications */
(function() {
  this.getServers = function() {
    function mockTimestamp(offset) {
      return new Date().getTime() - offset * 60000;
    }
    return [
      new ClusterManager.Server([ {"appId": 0, "startTime": mockTimestamp(32)} ], mockTimestamp(66)),
      new ClusterManager.Server([ {"appId": 2, "startTime": mockTimestamp(120)} ], mockTimestamp(123)),
      new ClusterManager.Server([ {"appId": 2, "startTime": mockTimestamp(120)} ], mockTimestamp(144)),
      new ClusterManager.Server([ {"appId": 4, "startTime": mockTimestamp(21)} ], mockTimestamp(29))
    ];
  };
  
  this.getAvailableApps = function() {
    return [
      new ClusterManager.AvailableApp(0, "Hadoop", "Hd"),
      new ClusterManager.AvailableApp(1, "Rails", "Ra"),
      new ClusterManager.AvailableApp(2, "Chronos", "Ch"),
      new ClusterManager.AvailableApp(3, "Storm", "St"),
      new ClusterManager.AvailableApp(4, "Spark", "Sp")
    ];
  };
}).apply(ClusterManager.Mock);