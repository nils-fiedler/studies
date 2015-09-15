var SetIntervalMixin = {
  componentWillMount: function() {
    this.intervals = [];
  },
  setInterval: function() {
    this.intervals.push(setInterval.apply(null, arguments));
  },
  componentWillUnmount: function() {
    this.intervals.map(clearInterval);
  }
};

var ClusterManagerApp = React.createClass({
  mixins: [SetIntervalMixin],
  childContextTypes: {
    availableApps: React.PropTypes.array,
    millisNow: React.PropTypes.number,
    onAddServer: React.PropTypes.func,
    onDestroyServer: React.PropTypes.func,
    onStartApp: React.PropTypes.func,
    onKillApp: React.PropTypes.func
  },
  getChildContext: function() {
    return {
        availableApps: this.state.availableApps,
        millisNow: this.state.millisNow,
        onAddServer: function() { return this.addServer(); }.bind(this),
        onDestroyServer: function(id) { return this.destroyServer(id); }.bind(this),
        onStartApp: function(id) { return this.startAppInstance(id); }.bind(this),
        onKillApp: function(id) { return this.killAppInstance(id); }.bind(this)
    };
  },
  getInitialState: function() {
    function mockTimestamp(offset) {
      return new Date().getTime() - offset * 60000;
    }
    return {
    millisNow: new Date().getTime(),
    runningServers: [
    {
      "apps": [ {"appId": 0, "startTime": mockTimestamp(32)} ],
      "creationDate": mockTimestamp(123)
      },
      {
      "apps": [ {"appId": 2, "startTime": mockTimestamp(120)} ],
      "creationDate": mockTimestamp(123)
      },
      {
      "apps": [ {"appId": 2, "startTime": mockTimestamp(120)} ],
      "creationDate": mockTimestamp(126)
      },
      {
      "apps": [ {"appId": 4, "startTime": mockTimestamp(21)} ],
      "creationDate": mockTimestamp(33)
      }
    ],
    availableApps: [
    {
      "id": 0,
      "title": "Hadoop",
      "tag": "Hd"
      },
      {
      "id": 1,
      "title": "Rails",
      "tag": "Ra"
      },
      {
      "id": 2,
      "title": "Chronos",
      "tag": "Ch"
      },
      {
      "id": 3,
      "title": "Storm",
      "tag": "St"
      },
      {
      "id": 4,
      "title": "Spark",
      "tag": "Sp"
      }
    ]};
  },
  componentDidMount: function() {
    // Set interval for timer
    this.setInterval(this.setMillisNow, 1000);
    // TODO Set interval for polling from server to get new servers INTERVAL = 3sec
    // TODO Set interval for polling from server to get availableApps INTERVAL > 1min maybe 5min-10min?
  },
  /** Add a new server */
  addServer: function() {
    this.state.runningServers.push({
      "apps": [ ],
      "creationDate": new Date().getTime()
    });
    this.setState({runningServers: this.state.runningServers});
  },
  /** Destroy a server at the given index or the last server if no serverIndex is specified */
  destroyServer: function(serverIndex) {
    if(this.state.runningServers.length > 0) {
      serverIndex = (serverIndex !== undefined) ? serverIndex : this.state.runningServers.length - 1;
      var serverToBeDestroyed = this.state.runningServers.splice(serverIndex, 1);
      // move all instances of running applications to another server
      for(var i = 0, l = serverToBeDestroyed[0].apps.length; i < l; ++i) {
        this.startAppInstance(serverToBeDestroyed[0].apps[i].appId);
      }
      this.setState({runningServers: this.state.runningServers});
    }
  },
  /** Start an instance of the given app type */
  startAppInstance: function(id) {
    var availableServer = this.getIndexOfNextAvailableServer();
    if(availableServer != -1) {
      this.state.runningServers[availableServer].apps.push({"appId": id, "startTime": new Date().getTime()});
      this.setState({runningServers: this.state.runningServers});
    }
  },
  /** Start an instance of the given app type */
  killAppInstance: function(id) {
    var newestAppInstance = this.getNewestAppInstance(id);
    if(newestAppInstance != -1) {
      this.state.runningServers[newestAppInstance.serverIndex].apps.splice(newestAppInstance.appIndex, 1);
      this.setState({runningServers: this.state.runningServers});
    }
  },
  /** Returns the first available server running maximal 1 app */
  getIndexOfNextAvailableServer: function() {
    if(this.state.runningServers && this.state.runningServers.length) {
      var i, l = this.state.runningServers.length;
      // return first server index running 0 app instances
      for(i = 0; i < l; ++i) {
        if (this.state.runningServers[i].apps.length === 0) { return i; }
      }
      // return first server index running 1 app instance
      for(i = 0; i < l; ++i) {
        if (this.state.runningServers[i].apps.length == 1) { return i; }
      }
    }
    return -1;
  },
  /** Returns the indices of the newest instance for given app-type id */
  getNewestAppInstance: function(id) {
    if(this.state.runningServers && this.state.runningServers.length && id >= 0) {
      var serverIndex = appIndex = -1;
      // iterate through runningServers
      for(var i = 0, l = this.state.runningServers.length; i < l; ++i) {
        // iterate over app instances on each server
        for(var j = 0, m = this.state.runningServers[i].apps.length; j < m; ++j) {
          // check for given app-type id
          if(this.state.runningServers[i].apps[j].appId == id) {
            // set indices for first server running an instance of app-type id
            // then check for newer instance
            if(serverIndex == -1 ||
                this.state.runningServers[i].apps[j].startTime >= 
                this.state.runningServers[serverIndex].apps[appIndex].startTime) {
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
  },
  /** Function to set milliseconds from curent time */
  setMillisNow: function() {
    this.setState({millisNow: new Date().getTime()});
  },
  render: function() {
    return (
      <div>
        <aside>
            <ServerControl />
            <AppControlList />
        </aside>
        <ServerCluster runningServers={this.state.runningServers} />
      </div>
    );
  }
});

var ServerCluster = React.createClass({
  setMillisNow: function() {
    this.setState({millisNow: new Date().getTime()});
  },
  getInitialState: function() {
    return {millisNow: new Date().getTime()}; 
  },
  componentDidMount: function() {
    this.interval = setInterval(this.setMillisNow, 1000);
  },
  componentWillUnmount: function() {
    clearInterval(this.interval);
  },
  render: function() {
    var serverNodes = this.props.runningServers.map(function(server, index) {
      return (
        <Server
            apps={server.apps}
            creationDate={server.creationDate}
            index={index}
            key={index}
        />
      );
    });
    return (
      <main>
        <h1>Cluster Monitor</h1>
        {serverNodes}
      </main>
    );
  }
});

var Server = React.createClass({
  contextTypes: {
    onDestroyServer: React.PropTypes.func.isRequired
  },
  handleClickDestroyServer: function(e) {
    e.preventDefault();    
    this.context.onDestroyServer(this.props.index);
  },
  render: function() {
    var appNodes = this.props.apps.map(function(app, index) {
      return (
        <App 
            id={app.appId}
            startTime={app.startTime}
            index={index}
            key={index}
        />
      );
    });
    var dynClass = "server-monitor";
    if(this.props.apps.length > 1){
        dynClass += " split";
    }  
    var creationDate;
    if(this.props.apps.length == 0) {
        creationDate = <p className="creation-date">Running for <TimeAgo startTime={this.props.creationDate} /></p>;
    }  
    return (
      <div className={dynClass}>
        {appNodes}
        {creationDate}
        <div className="destroy-overlay triangle"
            onClick={this.handleClickDestroyServer}
        >
          <span>×</span>
        </div>
      </div>
    );
  }
});

var App = React.createClass({
  contextTypes: {
    availableApps: React.PropTypes.array.isRequired
  },
  render: function() {
    var dynClass = "instance app-color-" + this.props.id;
    return (
      <div className={dynClass}>
        <p className="instance-tag">{this.context.availableApps[this.props.id].tag}</p>
        <p className="instance-title">{this.context.availableApps[this.props.id].title}</p>
        <p className="instance-start-time">Started <TimeAgo startTime={this.props.startTime} /> ago</p>
      </div>
    );
  }
});

var ServerControl = React.createClass({
  contextTypes: {
    onAddServer: React.PropTypes.func.isRequired,
    onDestroyServer: React.PropTypes.func.isRequired
  },
  handleClickAddServer: function(e) {
    e.preventDefault();    
    this.context.onAddServer();
  },
  handleClickDestroyServer: function(e) {
    e.preventDefault();    
    this.context.onDestroyServer();
  },
  render: function() {
    return (
      <nav className="server">
        <div className="server-ctrl add" onClick={this.handleClickAddServer}>
            <div className="circle">+</div>
            <p>Add Server</p>
        </div>
        <div className="server-ctrl destroy" onClick={this.handleClickDestroyServer}>
            <div className="circle">&ndash;</div>
            <p>Destroy</p>
        </div>
      </nav>
    );
  }
});

var AppControlList = React.createClass({
  contextTypes: {
    availableApps: React.PropTypes.object.isRequired
  },
  render: function() {
    var appControlNodes = this.context.availableApps.map(function(appControl, index) {
      return (
        <AppControl 
          id={index}
          title={appControl.title}
          key={index}
        />
      );
    });
    return (
      <nav className="apps">
        <p>Available Apps</p>
        <ul>
          {appControlNodes}
        </ul>
      </nav>
    );
  }
});

var AppControl = React.createClass({
  contextTypes: {
    onStartApp: React.PropTypes.func.isRequired,
    onKillApp: React.PropTypes.func.isRequired
  },
  handleClickStartApp: function(e) {
    e.preventDefault();
    this.context.onStartApp(this.props.id);
  },
  handleClickKillApp: function(e) {
    e.preventDefault();    
    this.context.onKillApp(this.props.id);
  },
  render: function() {
    var dynClass = "app-block app-color-" + this.props.id;
    var dynClass2 = "app-ctrl circle start app-color-" + this.props.id;
    return (
      <li className="available-app">
          <span className={dynClass}></span>
          <span className="app-title">{this.props.title}</span>
          <span className="app-ctrl circle kill"
                onClick={this.handleClickKillApp}
          >
            &ndash;
          </span>
          <span className={dynClass2}
                onClick={this.handleClickStartApp}
          >+</span>
      </li>
    );
  }
});

var TimeAgo = React.createClass({
  contextTypes: {
    millisNow: React.PropTypes.number.isRequired
  },
  getMillisAgo: function(millisAgo) {
    // return as days
    if(millisAgo >= 24*60*60*1000) {
      return parseInt(millisAgo / (24*60*60*1000)) + "d";
    }
    // return as hours
    else if(millisAgo >= 60*60*1000) {
      return parseInt(millisAgo / (60*60*1000)) + "h";
    }
    // return as minutes
    else if(millisAgo >= 60*1000) {
      return parseInt(millisAgo / (60*1000)) + "min";
    }
    // defaults to seconds
    else {
      return parseInt(millisAgo / 1000) + "sec";
    }
  },
  render: function() {
    return (
      <span className="time-ago">
        {this.getMillisAgo(this.context.millisNow - this.props.startTime)}
      </span>
    );
  }
});

React.render(
  <ClusterManagerApp />,
  document.getElementById("content")
);
