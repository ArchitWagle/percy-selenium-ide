// Licensed to the Software Freedom Conservancy (SFC) under one
// or more contributor license agreements.  See the NOTICE file
// distributed with this work for additional information
// regarding copyright ownership.  The SFC licenses this file
// to you under the Apache License, Version 2.0 (the
// "License"); you may not use this file except in compliance
// with the License.  You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

// Modified in tools.js from selenium-IDE
import finder from '@medv/finder'


// Handles all PercyHide related stuff
class PercyHideSelector {
  constructor(callback, cleanupCallback) {
    this.callback = callback
    this.cleanupCallback = cleanupCallback
    // This is for XPCOM/XUL addon and can't be used
    //var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
    //this.win = wm.getMostRecentWindow('navigator:browser').getBrowser().contentWindow;

    // Instead, we simply assign global content window to this.win
    this.win = window
    const doc = this.win.document
    const div = doc.createElement('div')
    div.setAttribute('style', 'display: none;')
    doc.body.insertBefore(div, doc.body.firstChild)
    this.div = div
    this.e = null
    this.r = null
    this.tempElem = []


    this.selecting = false
    // this.styleSheet is css to add a red dashed border to all the elements in
    // the DOM so that it becomes easy to select elements to hidden
    // This style is removed when user is done with using PercyHide
    this.styleSheet = doc.createElement("style")

    // This stylesheet is toggled on by clicking `t` key and toggled off by
    // clicking 'y' key. It basically contains the percyHide CSS
    // so that user gets a fair idea of which elements have actually been hidden
    this.styleSheet1 = doc.createElement("style")

    // function that puts a red border on all elements
    this.showAllElements(doc)

    // create initial blank canvas
    this.createCanvas()

    // banner contains the Percy Icon and stuff, not critical to functionality
    this.banner = doc.createElement('div')
    this.banner.setAttribute(
      'style',
      'position: fixed;top: 0;left: 0;bottom: 0;right: 0;background: trasparent;z-index: 10000;'
    )
    const header = doc.createElement('div')
    header.setAttribute(
      'style',
      "pointer-events: none;display: flex;align-items: center;justify-content: center;flex-direction: row;position: fixed;top: 20%;left: 50%;transform: translateX(-50%);background: #f7f7f7;color: #114990;font-size: 22px;font-weight: 200;z-index: 10001;font-family: system, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;box-shadow: 0 7px 10px 0 rgba(0,0,0,0.1);border: 1px black solid; border-radius: 50px;padding: 10px;"
    )
    const img = doc.createElement('img')
    img.src = browser.runtime.getURL('/icons/percy_icon_128.png')
    img.setAttribute('style', 'width: 28px;margin: 0 10px;')
    header.appendChild(img)
    const span = doc.createElement('span')
    span.setAttribute(
      'style',
      'border-left: 1px solid #c6c6c6;padding: 3px 10px;'
    )
    span.innerText = 'draw a box, topleft and bottomright'
    header.appendChild(span)
    setTimeout(() => {
      // this has to happen after a timeout, since adding it sync will add the event
      // before the window is focused which will case mousemove to fire before the
      // user actually moves the mouse
      this.banner.addEventListener(
        'mousemove',
        () => {
          setTimeout(() => {
            this.banner.style.visibility = 'hidden'
          }, 300)
        },
        false
      )
    }, 300)
    this.banner.appendChild(header)

    doc.body.insertBefore(this.banner, div)

    // Listners added to handle various events like user drawing rectangle, dragging,
    // clicking shift key, etc.
    doc.addEventListener('mousemove', this, true)
    doc.addEventListener('keydown', this, true)
    doc.addEventListener('keyup', this, true)
    doc.addEventListener('click', this, true)
  }

  // This code removes all css added during percyHide
  cleanup() {
    this.rect.remove()
    this.styleSheet.remove()

    this.canvas.remove()
    try {
      if (this.div) {
        if (this.div.parentNode) {
          this.div.parentNode.removeChild(this.div)
        }
        this.div = null
      }
      if (this.header) {
        if (this.header.parentNode) {
          this.header.parentNode.removeChild(this.header)
        }
        this.header = null
      }
      if (this.win) {
        const doc = this.win.document
        doc.removeEventListener('mousemove', this, true)
        doc.removeEventListener('click', this, true)
      }
    } catch (e) {
      if (e != "TypeError: can't access dead object") {
        throw e
      }
    }
    this.win = null
    if (this.cleanupCallback) {
      this.cleanupCallback()
    }
  }

  // draws red rectangle according to user mouse movements
  drawRect(){
    const canvasrealleft = this.boundaryLeft-this.canvas.getBoundingClientRect().left
    const canvasrealtop = this.boundaryTop-this.canvas.getBoundingClientRect().top
    this.canvas.getContext('2d').rect(canvasrealleft, canvasrealtop, this.boundaryRight -this.boundaryLeft, this.boundaryBottom-this.boundaryTop)
    this.canvas.getContext('2d').globalAlpha = 0.4
    this.canvas.getContext('2d').fillStyle = 'red'
    this.canvas.getContext('2d').fill()
    this.canvas.getContext('2d').globalAlpha = 1
    this.canvas.getContext('2d').shadowBlur = 10;
    this.canvas.getContext('2d').shadowColor = "red";
    this.canvas.getContext('2d').strokeStyle = "black";
    this.canvas.getContext('2d').strokeRect(canvasrealleft, canvasrealtop, this.boundaryRight -this.boundaryLeft, this.boundaryBottom-this.boundaryTop);
  }

  // refreshes or creates the canvas
  createCanvas(){
    if(typeof this.canvas!='undefined')this.canvas.remove()
    this.canvas = this.win.document.createElement('canvas')
    this.canvas.width = window.innerWidth
    var body = document.body,
    html = document.documentElement;

    let height = Math.max( document.body.scrollHeight, document.body.offsetHeight,
                       document.documentElement.clientHeight, document.documentElement.scrollHeight,
                       document.documentElement.offsetHeight )
    this.canvas.height = height
    //Position canvas
    this.canvas.style.position='absolute'
    this.canvas.style.left=0
    this.canvas.style.top=0
    this.canvas.style.zIndex=100000
    this.canvas.style.pointerEvents='none'
    this.win.document.body.appendChild(this.canvas)

  }

  // event Handlers
  /*
  A brief summary of all the events and what they do
  mousemove:
    If the user has aldready clicked a top left corner, then mousemove redraws a
    rectangle from the top-left fixed point upto the current mouse location
    (bottom-right), so that the rectangle changes as the mouse moves.
  click:
    when this.selecting = false, sets the top-left corner of rectangle
    when this.selecting = true, sets the bottom-right corner of rectangle
  shift key:
    This submits the selected elements and returns. Equivalent to pressing enter
    on a text box
  t key:
    toggles on the percyCSS in current window
  y key:
    toggles off the percyCSS in current window




  */
  handleEvent(evt) {
    switch (evt.type) {

      case 'mousemove':
        if(this.selecting) {
          this.boundaryRight = evt.clientX
          this.boundaryBottom= evt.clientY
          this.createCanvas()
          this.drawRect()


        }
        break

      case 'click':
        // set bottom-right corner of rect
        if (this.selecting) {
          if (evt.button == 0 &&  this.callback) {
            this.selecting = false

            this.boundaryRight = evt.clientX
            this.boundaryBottom= evt.clientY
            console.log(['client',evt.clientX,evt.clientY])
            this.drawRect()
          } //Right click would cancel the select

          evt.preventDefault()
          evt.stopPropagation()
          this.selecting = false

        }
        // set top-left corner of rect
        else {
          if (evt.button == 0 && this.callback) {
            this.selecting = true
            this.rect = this.win.document.createElement('div')


            this.createCanvas()
            this.boundaryLeft = evt.clientX
            this.boundaryTop = evt.clientY
            console.log(['client',evt.clientX,evt.clientY])
            console.log(this.rect)
            evt.preventDefault()

          } //Right click would cancel the select
          else {
            evt.preventDefault()
            evt.stopPropagation()
            this.cleanup()
          }
        }
        break

      case 'keydown':
        // If shift key is pressed return
        if(evt.keyCode === 16 || evt.charCode === 16){
          this.dfs(this.win.document.body)
          this.callback(this.percy_css_string, this.win.document.body)
          this.cleanup()

        }
        // press t
        else if (evt.keyCode === 84 || evt.charCode === 84) {
          this.dfs(this.win.document.body)
          this.styleSheet1.type = "text/css"
          this.styleSheet1.innerText += this.percy_css_string
          this.win.document.head.appendChild(this.styleSheet1)

        }
        // press y
        else if (evt.keyCode === 89 || evt.charCode === 89) {
          this.styleSheet1.remove()
        }
        break
    }
  }


/*
  performs a DFS on the DOM and when it reaches an element X that lies completely within
  the box drawn by the user, it adds the display:none css to X's locator and
  dosen't explore X's children. (Has potential drawbacks but efficient)
*/
  dfs(elem){
    let stack = []
    stack.push(elem)
    while(stack.length!=0){
      elem = stack.pop()
      let curr_elem = elem.getBoundingClientRect()
      if(
        curr_elem.left>this.boundaryLeft &&
        curr_elem.right<this.boundaryRight &&
        curr_elem.bottom<this.boundaryBottom &&
        curr_elem.top> this.boundaryTop &&
        elem != this.banner ){
          this.percy_css_string += finder(elem) + ","
        }
      else {
          elem.childNodes.forEach(function(a) {
            if(a.nodeType == 1){
              stack.push(a)
            }
          })
      }
    }
    this.percy_css_string= this.percy_css_string.replace(/,$/, '')
    this.percy_css_string+="{ display: none !important; }"
  }




  highlight(doc, x, y) {
    if (doc) {
      const e = doc.elementFromPoint(x, y)
      if (e && e != this.e) {
        this.highlightElement(e)
      }
    }
  }

  highlightElement(element) {
    if (element && element != this.e && element !== this.banner) {
      this.e = element
    } else {
      return
    }
    const r = element.getBoundingClientRect()
    const or = this.r
    if (r.left >= 0 && r.top >= 0 && r.width > 0 && r.height > 0) {
      if (
        or &&
        r.top == or.top &&
        r.left == or.left &&
        r.width == or.width &&
        r.height == or.height
      ) {
        return
      }
      this.r = r
      const style =
        'pointer-events: none; position: absolute; background-color: rgb(78, 171, 230); opacity: 0.4; border: 1px solid #0e0e0e; z-index: 1000000;'
      const pos = `top:${r.top + this.win.scrollY}px; left:${r.left +
        this.win.scrollX}px; width:${r.width}px; height:${r.height}px;`
      this.div.setAttribute('style', style + pos)
    } else if (or) {
      this.div.setAttribute('style', 'display: none;')
    }
  }

  showAllElements(doc) {
    const styles = `
                * {
                  outline: 1px solid red;
                  outline-offset: -1px;
                  outline-style: dashed;
                  }
                  `

    this.styleSheet.type = "text/css"
    this.styleSheet.innerText = styles
    doc.head.appendChild(this.styleSheet)
  }

}

export default PercyHideSelector
