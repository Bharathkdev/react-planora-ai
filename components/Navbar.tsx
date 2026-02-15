import { Box } from "lucide-react"
import { useOutletContext } from "react-router";

import Button from "./ui/Button";

const Navbar = () => {
    // Auth state & actions provided from root Outlet context
    const { isSignedIn, userName, signIn, signOut, refreshAuth } = useOutletContext<AuthContext>();

    // Single handler toggles between login & logout
    const handleAuthClick = async () => {
        if (isSignedIn) {
            try {
                await signOut();
            } catch (error) {
                console.error(`Puter Sign Out failed: ${error}`);
            }
            return;
        }

        try {
            await signIn();
        } catch (error) {
            console.error(`Puter Sign In failed: ${error}`);
        }

        await refreshAuth();
    };

    return (
        <header className="navbar">
            <nav className="inner">
                <div className="left">
                    <div className="brand">
                        <Box className="logo" />
                        <span className="name">Planora</span>
                    </div>

                    <ul className="links">
                        <a href="#">Product</a>
                        <a href="#">Pricing</a>
                        <a href="#">Community</a>
                        <a href="#">Enterprise</a>
                    </ul>
                </div>

                {/* Authentication area */}
                <div className="actions">
                    {isSignedIn ? (
                        <>
                            {/* Show user identity when signed in */}
                            <span className="greeting">
                                {userName ? `Hi, ${userName}` : "My Account"}
                            </span>

                            <Button size="sm" onClick={handleAuthClick} className="btn">
                                Log Out
                            </Button>
                        </>
                    ) : (
                        <>
                            {/* Login triggers Puter auth popup */}
                            <Button size="sm" onClick={handleAuthClick} variant="ghost">
                                Log In
                            </Button>

                            {/* Scrolls to upload section */}
                            <a href="#upload" className="cta">
                                Get Started
                            </a>
                        </>
                    )}
                </div>
            </nav>
        </header>
    )
}

export default Navbar;
