'use client'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAngleLeft } from '@fortawesome/free-solid-svg-icons'
import React, { useEffect, useState } from 'react'
import classNames from 'classnames'
import { Button } from 'react-bootstrap'
import { useSidebar } from '../SidebarProvider'

export default function Sidebar({ children }) {
	const [isNarrow, setIsNarrow] = useState(false)

	const { showSidebarState: [isShowSidebar] } = useSidebar()

	const toggleIsNarrow = () => {
		const newValue = !isNarrow
		localStorage.setItem('isNarrow', newValue ? 'true' : 'false')
		setIsNarrow(newValue)
	}

	// On first time load only
	useEffect(() => {
		const test = localStorage.getItem('isNarrow')
		setIsNarrow(test === 'true' ? true : false)
	}, [])

	return <div className={classNames(
		"admin_sidebar d-flex flex-column position-fixed h-100 border-end",
		{
			"sidebar-narrow": isNarrow,
			show: isShowSidebar,
		},
	)} id="sidebar">
		<div className="sidebar-brand d-none d-md-flex align-items-center justify-content-center py-8">
			<div className="sidebar-brand-full">
				<img src="/img/logo__.png" alt="" className="img-fluid" />
			</div>
			<div className="sidebar-brand-narrow d-none">
				<img src="/img/logosmall.png" alt="" height={20} className="img-fluids" />
			</div>
		</div>

		<div className="sidebar-nav flex-fill border-top">
			{children}
		</div>

		<Button variant="link" className="sidebar-toggler d-none d-md-inline-block rounded-0 text-end pe-4 fw-bold shadow-none border-top" onClick={toggleIsNarrow} type="button" aria-label="sidebar toggler">
			<FontAwesomeIcon className="sidebar-toggler-chevron" icon={faAngleLeft} fontSize={24} />
		</Button>
	</div>;
}
