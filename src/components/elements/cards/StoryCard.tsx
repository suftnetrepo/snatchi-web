import NextLink from 'components/reuseable/links/NextLink';
import Link from 'next/link';
import { FC, ReactElement } from 'react';

type CardProps = {
    link: string;
    title: string;
    category: string;
    description: ReactElement;
    cardTop: ReactElement;
    position: 'left' | 'right' | 'top' | 'bottom'
};

const StoryCard = ({ cardTop, title, category, description, link, position }: CardProps) => {

    return (
        <article className="post">
            <div className="card">

                <div className="card-body">
                    <div className="row">
                        {
                            position === 'left' && (
                                <div className="col-lg-4 col-xl-4 col-xxl-4 align-items-center">
                                    {cardTop}
                                </div>
                            )
                        }
                        <div className="col-lg-8 col-xl-8 col-xxl-8">
                            <div className="post-header">
                                <div className="post-category text-line">
                                    <NextLink title={category} href="#" className="hover" />
                                </div>

                                <h2 className="post-title mt-1 mb-0">
                                    <NextLink title={title} className="link-dark" href={link} />
                                </h2>
                            </div>

                            <div className="post-content">
                                {description}
                            </div>
                        </div>
                        {
                            position === 'right' && (
                                <div className="col-lg-4 col-xl-4 col-xxl-4 align-items-center">
                                    {cardTop}
                                </div>
                            )
                        }

                    </div>
                </div>
            </div>
        </article>
    );
};

export default StoryCard;
