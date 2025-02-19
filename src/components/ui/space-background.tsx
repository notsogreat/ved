'use client'

export function SpaceBackground() {
  return (
    <>
      <div className="stars dark:opacity-100 opacity-30" />
      <div className="glow-orb-1 dark:opacity-100 opacity-30" />
      <div className="glow-orb-2 dark:opacity-100 opacity-30" />
      <div className="floating-light light-1 dark:opacity-100 opacity-30" style={{ top: "25%", left: "10%" }} />
      <div className="floating-light light-2 dark:opacity-100 opacity-30" style={{ top: "40%", right: "15%" }} />
      <div className="floating-light light-3 dark:opacity-100 opacity-30" style={{ bottom: "30%", left: "20%" }} />
      <div className="floating-light light-4 dark:opacity-100 opacity-30" style={{ bottom: "20%", right: "25%" }} />
      <div className="floating-light light-5 dark:opacity-100 opacity-30" style={{ top: "15%", right: "30%" }} />
    </>
  )
} 