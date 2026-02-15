import { Box } from "lucide-react"
import Button from "./ui/Button";
import { useOutletContext } from "react-router";

const Navbar = () => {
    const { isSignedIn, userName, signIn, signOut } = useOutletContext<AuthContext>();

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

                <div className="actions">
                    {isSignedIn ? (
                        <>
                            <span className="greeting">
                                {userName ? `Hi, ${userName}` : "My Account"}
                            </span>

                            <Button size="sm" onClick={handleAuthClick} className="btn">
                                Log Out
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button size="sm" onClick={handleAuthClick} variant="ghost">
                                Log In
                            </Button>

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