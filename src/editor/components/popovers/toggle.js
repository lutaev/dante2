import React from 'react'

export default function({ item, handleClick }) {
  return (
    <li className="dante-menu-button" onMouseDown={handleClick}>
      <span className={ 'dante-icon'}>
        {item.icon()}
      </span>
    </li>
  )
}
