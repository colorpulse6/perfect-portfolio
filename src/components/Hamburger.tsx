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
type HamburgerSpinAttributes = React.ComponentProps<typeof HamburgerSpin> &
  React.ButtonHTMLAttributes<HTMLButtonElement>

const AccessibleHamburgerSpin =
  HamburgerSpin as React.ComponentType<HamburgerSpinAttributes>

const Hamburger: React.FC<HamburgerProps> = ({ navOpen, setNavOpen }) => {
  const toggleButton = (): void => {
    setNavOpen(!navOpen)
  }

  return (
    <>
      <AccessibleHamburgerSpin
        buttonStyle={{ border: "none", outline: "none" }}
        barColor="white"
        isActive={navOpen}
        toggleButton={toggleButton}
        aria-label="Toggle site navigation"
        aria-controls="site-navigation"
        aria-expanded={navOpen}
      />
    </>
  )
}

export default Hamburger
