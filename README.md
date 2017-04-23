# base-component

Base class for extending all your components and logging lots of react lifecycle methods.  

- Easily support parent to child communication through this.parent.parent.parent.parent, however deep you want.  
- You merely pass a prop to all children of parent={this}.  
- Embed useful tools such as this.setComponentState({}) to handle deepMerges for you. 
- Will also show performance statistics.  

To get started merely import and extend all of your react classes instead of react's own Component and then for development mode in your app, merely set `window.showBaseComponentLog = true` and `window.showBaseComponentStateChanges = true` so the extra logging is for you and not in production.
