import { Navbar } from '@/components/blocks/navbar';
import { FC, ReactElement } from 'react';

// ==============================================================
type linkProps = { stickyBox? : boolean, className: string; button: ReactElement };
// ==============================================================

const NavBarLink: FC<linkProps> = ({ stickyBox = false, className, button }) => {
    return (
        <Navbar
            stickyBox={stickyBox}
            logoAlt="logo-purple"
            navOtherClass="navbar-other ms-lg-4"
            navClassName= {className}
            button={button}
        />
    );
};

export default NavBarLink;
