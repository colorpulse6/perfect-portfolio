import React, { useState, useCallback } from "react"
import { HamburgerSpin } from "react-animated-burgers"

const Hamburger = props => {
  const toggleButton = () => props.setNavOpen(!props.navOpen)

  return (
    <>
      <HamburgerSpin
        buttonStyle={{ border: "none", outline: "none" }}
        barColor={"white"}
        isActive={props.navOpen}
        toggleButton={toggleButton}
      />
    </>
  )
}

export default Hamburger
