import Link from "next/link";
import { FC, ReactNode } from 'react';

interface NextLinkProps {
  href: string;
  className?: string;
  title: ReactNode;
}

const NextLink: FC<NextLinkProps> = props => {
	const { href, className, title } = props;

	return (
		<Link href={href} className={className}>
			{title}
		</Link>
	);
};

export default NextLink;
