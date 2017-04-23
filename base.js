import React, {Component} from 'react';
import ReactPerfAnalysis from 'react-addons-perf'
const objectAssign = require('object-assign');
// Most logging code stolen from https://www.npmjs.com/package/react-log-lifecycle

// Optional flags:
const flags = {
  // If logType is set to keys then the props of the object being logged
  // will be written out instead of the whole object. Remove logType or
  // set it to anything except keys to have the full object logged.
  logType: 'keys',
  // A list of the param "types" to be logged.
  // The example below has all the types.
  names: ['props', 'nextProps', 'nextState', 'prevProps', 'prevState']
};

class BaseComponent extends Component {
  constructor(props, flags) {
    super(props);
    this.updateParent(props);
    this.showLog = window.hasOwnProperty("showBaseComponentLog") ? window.showBaseComponentLog: false;
    this.showStateChanges = window.hasOwnProperty("showBaseComponentStateChanges") ? window.showBaseComponentStateChanges: false;
    this.cycleNum = 1;
    this.flags = flags || {};

    if (this.showLog) {
      console.log(performance.now());
      console.log(this.getClassName());
      console.log(`#${this.cycleNum}.1 constructor(props)
  - Start of cycle #${this.cycleNum}
  - replaces getInitialState()
  - assign to this.state to set initial state.
`);
    }
    this._log({props});
  }

  mergeDeep(target, source) {
    let output = objectAssign({}, target);
    if (target === null) {
      target = {};
    }
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            objectAssign(output, { [key]: source[key] });
          } else {
            if (Object.keys(source[key]).length === 0) {
              objectAssign(output, { [key]: source[key] });
            } else {
              output[key] = this.mergeDeep(target[key], source[key]);
            }
          }
        } else {
          objectAssign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  }

  isObject(item)  {
    return (item && typeof item === 'object' && !Array.isArray(item) && item !== null);
  }

  updateParent(props) {
    if (props.hasOwnProperty("parent")) {
      this.parent = props.parent;
      this.parentState = props.parent.state;
      // core.Debug.Dump("this.parent", this.parent, "this.parentState", this.parentState);
    }
  }

  replaceAll(source, value, replacementValue) {
    if (source == undefined) {
      return source;
    }
    return source.replace(new RegExp(value, "g"), replacementValue);
  }

  openFile(callback, accept){
    // Check for the various File API support.
    if (window.File && window.FileReader && window.FileList && window.Blob) {
      // Great success! All the File APIs are supported.
      var acceptInsert = "";
      if(accept)
        acceptInsert =  "accept='" + accept + "'";
      var fileInput = $("<input type='file' name='files[]' " + acceptInsert + "/>");
      $("body").append(fileInput);
      fileInput.trigger("click");
      fileInput.on('change', function(evt){
        console.log(evt.target.files[0]);

          var reader = new FileReader();
          var fileName = evt.target.files[0].name;
          //When the file has been read...
          reader.onload = function (ev) {
              try {
                  var jsonObj = new Object();
                  jsonObj.fileName = fileName;
                  jsonObj.data = window.atob(ev.target.result.substr(ev.target.result.indexOf("base64,") + 7));
                  callback(jsonObj);
                  fileInput.remove();
              }
              catch (ex) {
                  alert(ex);
              }
          };
          //And now, read the image and base64
          reader.readAsDataURL(evt.target.files[0]);
      });
    } else {
      alert('The File APIs are not fully supported in this browser.');
    }
  }

  setParentState(stateChanges, cb) {
    this.setComponentState(stateChanges, cb, true)
  }

  setComponentState(stateChanges, cb, setParent=false) {
    var callback = cb;

    if (this.showStateChanges && this.showLog) {
      console.log(performance.now());
      this.stack = new Error().stack;
      var line = "";
      if (this.stack.split("\n")[2].indexOf("makeAssimilatePrototype.js") > -1) {
        line = this.stack.split("\n")[3];
      } else {
        line = this.stack.split("\n")[2];
      }

      console.groupCollapsed(line.trim(), " called => setComponentState(", stateChanges, ")");

      console.groupCollapsed("Stacktrace");
      console.log(this.stack);
      console.groupEnd("");
      console.log("-----<setComponentState>----");
      console.log("");
      console.log("");
      console.log('State changes proposed:', stateChanges);
      console.log("React Object:", this);
    }

    var merge = this.mergeDeep(this.state, stateChanges);
    if (this.showStateChanges && this.showLog) {
      console.log("Merged State Sent To setState:", merge);
      console.log("");
      console.log("");
      console.log("-----</setComponentState>----");
      console.groupEnd();
    }

    if (Object.keys(stateChanges).length > 0) {
      let ptr = null;
      if (!setParent) {
        ptr = this;
      } else if (setParent && typeof(this.parent) != "undefined") {
        ptr = this.parent;
      } else {
        ptr = this;
      }
      ptr.setState(merge, ()=> {
        if (typeof(callback) == "function") {
          callback();
        }
        if (this.showStateChanges && this.showLog) {
          var line = "";
          if (this.stack.split("\n")[2].indexOf("makeAssimilatePrototype.js") > -1) {
            line = this.stack.split("\n")[3];
          } else {
            line = this.stack.split("\n")[2];
          }
          console.group("Callback After React setState -> " + line.trim(), " called => setComponentState(", stateChanges, ")");
          console.log(performance.now());
          console.groupCollapsed("Stacktrace");
          console.log(this.stack);
          console.groupEnd("");
          console.warn("React Is Done Mutating State From Requested Change", stateChanges);
          console.warn("The True state of your component: ", this.state);
          console.groupEnd();
        }
      });
    } else {
      if (callback) {
        callback();
      }
    }
  }

  _log(obj) {

    if (this.showLog) {
      // obj should have a single property.
      // The name (key) of that property should be switched on in the flags
      // object if it should be logged. You swith it on by adding it to the
      // flags.names array.
      // The value of the single prop in obj is the object that is to be
      // logged. (Or the keys of the object to be logged.)
      const keys = Object.keys(obj);
      if (keys.length !== 1) {
        return;
      }
      const key = keys[0];

      if (this.flags.names && this.flags.names.indexOf(key) >= 0) {
        // The flags object can override logging the object by changing
        // the logType to 'keys' to just log out the keys of the object.
        const logObj = (this.flags.logType && this.flags.logType === 'keys' && obj[key])
            ? Object.keys(obj[key])
            : obj[key];

        console.log(key + ':', logObj);
      }
    }
  }

  componentWillMount() {
    if (this.showLog) {
      console.log(performance.now());
      console.log(this.getClassName());
      console.log(`#${this.cycleNum}.2 componentWillMount()
  - Invoked Once (client and server)
  - Can change state here with this.setState()  (will not trigger addition render)
  - Just before render()
`);
    }
  }

  componentDidMount() {
    this.updateParent(this.props);

    if (this.showLog) {
      console.log(performance.now());
      console.log(this.getClassName());
      console.log(`#${this.cycleNum}.3 componentDidMount()
  - Invoked Once (client only)
  - refs to children now available
  - integrate other JS frameworks, timers, ajax etc. here
  - Just after render()
  - End of Cycle #${this.cycleNum}
`);
    }
    this.cycleNum = 2;
  }

  componentWillReceiveProps(nextProps) {
    if (this.showLog) {
      console.log(performance.now());
      console.log(this.getClassName());
      console.log(`#${this.cycleNum}.1 componentWillReceiveProps(nextProps)
  - Start of cycle #${this.cycleNum}
  - invoked when component is receiving new props
  - not called in cycle #1
  - this.props is old props
  - parameter to this function is nextProps
  - can call this.setState() here (will not trigger addition render)
`);
    }
    this.updateParent(nextProps);

    if (this.showLog) {
      console.group("componentWillReceiveProps (" + this.getClassName() + ")");
      console.log("Old Props", this.props);
      console.log("New Props", nextProps);
      console.groupEnd();
    }

    this._log({nextProps});
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (this.showLog) {
      console.log(performance.now());
      console.log(this.getClassName());
      console.log(`#${this.cycleNum}.2 shouldComponentUpdate(nextProps, nextState)
  - invoked when new props/state being received
  - not called on forceUpdate()
  - returning false from here prevents component update and the next 2 parts of the Lifecycle: componentWillUpdate() componentDidUpdate()
  - returns true by default;
`);
    }
    this.updateParent(nextProps);
    this._log({nextProps});
    this._log({nextState});
    return true;
  }

  componentWillUpdate(nextProps, nextState) {
    this.updateParent(nextProps);

    if (this.showLog) {
      console.log(performance.now());
      console.log(this.getClassName());
      console.log(`#${this.cycleNum}.3 componentWillUpdate(nextProps, nextState)
  - cannot use this.setState() (do that in componentWillReceiveProps() above)
  - Just before render()
`);
    }

    if (this.showLog) {
       ReactPerfAnalysis.stop();
       console.groupCollapsed("> React Inline Render Performance Using DeveloperLogStateChangePerformance (Expand me please!!) <");
       console.warn("Time Wasted Below:");
       ReactPerfAnalysis.printWasted();
       console.warn("Render Time In Your Code(Without react):");
       ReactPerfAnalysis.printExclusive();
       console.warn("Render Time Complete Breakdown:");
       ReactPerfAnalysis.printInclusive();
       console.groupEnd();
    }

    this._log({nextProps});
    this._log({nextState});
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.showLog) {
      console.log(performance.now());
      console.log(this.getClassName());
      console.log(`#${this.cycleNum}.4 componentDidUpdate(prevProps, prevState)
  - Just after render()
`);
    }
    this._log({prevProps});
    this._log({prevState});

  }

  componentWillUnmount() {
    this.cycleNum = 3;
    if (this.showLog) {
      console.log(performance.now());
      console.log(this.getClassName());
      console.log(`#${this.cycleNum}.1 componentWillUnmount()
  - invoked immediately before a component is unmounted from DOM
  - do cleanup here. e.g. kill timers and unlisten to events such as flux store updates
`);
    }
  }

  getClassName() {
    return this.constructor.toString().split("function ")[1].split("(")[0];
  }

  logRender() {
    if (this.showLog) {
      console.log(performance.now());
      console.log('render invoked', this);
    }

    if (this.showLog) {
       ReactPerfAnalysis.start();
    }
  }
}

export default BaseComponent;

