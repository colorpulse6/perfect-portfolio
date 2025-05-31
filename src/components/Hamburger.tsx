import React from "react"
import { HamburgerSpin } from "react-animated-burgers"

// Define the props interface for the Hamburger component
interface HamburgerProps {
  /** Whether the navigation menu is currently open */
  navOpen: boolean
  /** Function to toggle the navigation menu state */
  setNavOpen: (isOpen: boolean) => void
}

/**
 * Hamburger menu component that displays an animated hamburger icon
 * @param props - The component props
 * @returns JSX element for the hamburger menu
 */
const Hamburger: React.FC<HamburgerProps> = ({ navOpen, setNavOpen }) => {
  const toggleButton = (): void => {
    setNavOpen(!navOpen)
  }

  return (
    <>
      <HamburgerSpin
        buttonStyle={{ border: "none", outline: "none" }}
        barColor="white"
        isActive={navOpen}
        toggleButton={toggleButton}
      />
    </>
  )
}

export default Hamburger
