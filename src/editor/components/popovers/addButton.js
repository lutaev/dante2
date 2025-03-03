import React from 'react'
import ReactDOM from 'react-dom'


import {
  addNewBlock,
  resetBlockWithType,
  getCurrentBlock
} from '../../model/index.js'

import {
  getVisibleSelectionRect
} from 'draft-js'

import { getSelectionRect,
  getSelection,
  getSelectedBlockNode,
  getRelativeParent } from "../../utils/selection.js"

import {InlinetooltipWrapper} from '../../styled/base'

import {add} from "../icons.js"

export default class DanteInlineTooltip extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      position: { top: 0, left: 0 },
      show: false,
      scaled: false,
      scaledWidth: 0
    }
    this.initialPosition = 0
  }

  UNSAFE_componentWillReceiveProps(newProps) {
    return this.collapse()
  }

  display =(b)=> {
    if (b) {
      return this.show()
    } else {
      return this.hide()
    }
  }

  show = ()=> {
    return this.setState({
      show: true })
  }

  hide = ()=> {
    return this.setState({
      show: false })
  }

  setPosition =(coords)=> {
    return this.setState({
      position: coords })
  }

  _toggleScaled =(ev)=> {
    ev.preventDefault()
    if (this.state.scaled) {
      return this.collapse()
    } else {
      return this.scale()
    }
  }

  scale = ()=> {
    if(this.state.scaled){
      return
    }
    return this.setState({
      scaled: true }, ()=>{
      this.setState({scaledWidth: 300})
    })
  }

  collapse = ()=> {
    if(!this.state.scaled){
      return
    }
    return this.setState({
      scaled: false }, ()=>{
      setTimeout(()=>{
        this.setState({scaledWidth: 0})
      }, 300)

    })
  }

  activeClass = ()=> {
    //if @props.show then "is-active" else ""
    if (this.isActive()) {
      return "is-active"
    } else {
      return ""
    }
  }

  isActive = ()=> {
    return this.state.show
  }

  scaledClass = ()=> {
    if (this.state.scaled) {
      return "is-scaled"
    } else {
      return ""
    }
  }

  // expand , 1, widht 2. class
  // collapse , class, width

  clickOnFileUpload = ()=> {
    this.fileInput.click()
    this.collapse()
    return this.hide()
  }

  handlePlaceholder =(input)=> {
    let opts = {
      type: input.widget_options.insert_block,
      placeholder: input.options.placeholder,
      endpoint: input.options.endpoint
    }

    return this.props.onChange(resetBlockWithType(this.props.editorState, 'placeholder', opts))
  }

  insertImage =(file)=> {
    if(!file)
      return

    let opts = {
      url: URL.createObjectURL(file),
      file
    }
    // cleans input image value
    this.fileInput.value = ""

    return this.props.onChange(addNewBlock(this.props.editorState, 'image', opts))
  }

  handleFileInput = (e)=> {
    let fileList = e.target.files
    // TODO: support multiple file uploads
    /*
    Object.keys(fileList).forEach (o)=>
      @.insertImage(fileList[0])
    */
    return this.insertImage(fileList[0])
  }

  handleInsertion = (e)=>{
    this.hide()
    return this.props.onChange(addNewBlock(this.props.editorState, e.type, {}))
  }

  widgets = ()=> {
    return this.props.editor.props.widgets
  }

  clickHandler =(e, type)=> {
    let request_block = this.widgets().find(o => o.type === type)
    switch (request_block.widget_options.insertion) {
      case "upload":
        return this.clickOnFileUpload(e, request_block)
      case "placeholder":
        return this.handlePlaceholder(request_block)
      case "insertion":
        return this.handleInsertion(request_block)
      default:
        return console.log(`WRONG TYPE FOR ${ request_block.widget_options.insertion }`)
    }
  }

  getItems = ()=> {
    return this.widgets().filter(o => {
      return o.widget_options ? o.widget_options.displayOnInlineTooltip : null
    })
  }

  isDescendant =(parent, child)=> {
    let node = child.parentNode
    while (node !== null) {
      if (node === parent) {
        return true
      }
      node = node.parentNode
    }
    return false
  }

  relocate = ()=>{

    if(!this.props.editor.focus)
      return this.hide()

    const { editorState } = this.props
    const currentBlock = getCurrentBlock(this.props.editorState)
    const blockType = currentBlock.getType()
    const block = currentBlock

    if (!editorState.getSelection().isCollapsed()){
      return
    }

    // display tooltip only for unstyled

    let nativeSelection = getSelection(window)
    if (!nativeSelection.rangeCount) {
      return
    }

    let selectionRect = getSelectionRect(nativeSelection)

    let parent = ReactDOM.findDOMNode(this.props.editor)

    // hide if selected node is not in editor
    if (!this.isDescendant(parent, nativeSelection.anchorNode)) {
      this.hide()
      return
    }

    const { parentElement, clientHeight, clientWidth } = this.tooltip
    const relativeParent = getRelativeParent(parentElement);
    const toolbarHeight = clientHeight;
    const toolbarWidth = clientWidth;
    const relativeRect = (relativeParent || document.body).getBoundingClientRect();

    if(!relativeRect || !selectionRect)
      return

    let top = (selectionRect.top - relativeRect.top) - (toolbarHeight/5)
    let left = (selectionRect.left - relativeRect.left + (selectionRect.width/2) ) - (toolbarWidth*1.3)

    if (!top || !left) {
      return
    }

    this.display(block.getText().length === 0 && blockType === "unstyled")

    this.setPosition({
      top: top , //+ window.scrollY - 5,
      left: left,
      //show: block.getText().length === 0 && blockType === "unstyled"
    })
  }

  render() {
    return (
      <InlinetooltipWrapper
        ref={el => { this.tooltip = el }}
        className={ `inlineTooltip ${ this.activeClass() } ${ this.scaledClass() }` }
        style={ this.state.position }
      >
        <button
          type="button"
          className="inlineTooltip-button control"
          title="Close Menu"
          data-action="inline-menu"
          onMouseDown={ this._toggleScaled }
        >
          {add()}
        </button>
        <div
          className="inlineTooltip-menu"
          style={ { width: `${ this.state.scaledWidth }px` } }
        >
          { this.getItems().map( (item, i) => {
            return  <InlineTooltipItem
              item={ item }
              key={ i }
              clickHandler={ this.clickHandler }
            />
          })
          }

          <input
            type="file"
            accept="image/*"
            style={ { display: 'none' } }
            ref={el => { this.fileInput = el }}
            multiple="multiple"
            onChange={ this.handleFileInput }
          />

        </div>
      </InlinetooltipWrapper>
    )
  }
}

class InlineTooltipItem extends React.Component {

  clickHandler = (e)=> {
    e.preventDefault()
    return this.props.clickHandler(e, this.props.item.type)
  }

  render() {
    return (
      <button
        type="button"
        className="inlineTooltip-button scale"
        title={ this.props.title }
        onMouseDown={ this.clickHandler }
        onClick={(e)=> e.preventDefault()}
        style={{fontSize: '21px'}}
      >
        {
          <span className={ 'tooltip-icon'}>
          {this.props.item.icon()}
        </span>
        }
      </button>
    )
  }
}

export const DanteInlineTooltipConfig = (options={})=>{
  let config = {
    ref: 'add_tooltip',
    component: DanteInlineTooltip
  }
  return Object.assign(config, options)
}

