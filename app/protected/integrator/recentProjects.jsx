import React, { useEffect, useState } from 'react';
import { Table } from 'react-bootstrap';
import { useRouter } from 'next/navigation';
import { useProjectDashboard } from '../../../hooks/useProjectDashboard';
import { dateFormatted, getStatusColorCode } from '../../../utils/helpers';
import RenderProjectOffcanvas from '../../protected/guest/dashboard/renderProjectOffcanvas';

const RecentProjects = () => {
	const router = useRouter();
	const [showProjectOffcanvas, setShowProjectOffcanvas] = useState(false);
	const [project, setProject] = useState({});
	const { handleRecent, handleSelect, recent, data, loading, error } = useProjectDashboard();

	useEffect(() => {
		handleRecent();
	}, []);

	const handleCloseProjectOffcanvas = () => {
		setShowProjectOffcanvas(false);
	};

	return (
		<div className="table-responsive">
			<Table className="table  table-striped">
				<thead>
					<tr>
						<th>Name</th>
						<th>Start Date</th>
						<th>End Date</th>

						<th>Status</th>
					</tr>
				</thead>
				<tbody>
					{loading && (
						<tr><td colSpan={4} className="text-center text-muted py-4">Loading recent projects…</td></tr>
					)}
					{!loading && error && (
						<tr><td colSpan={4} className="text-center text-danger py-4">Recent projects could not be loaded.</td></tr>
					)}
					{!loading && !error && Array.isArray(data) && data.length === 0 && (
						<tr><td colSpan={4} className="text-center text-muted py-4">No projects yet.</td></tr>
					)}
					{data?.map((item, index) => (
						<tr key={item.projectId || index}>
							<td>
								<a
									className="pointer text-dark "
									onClick={() => {
										handleSelect(item?.projectId )
										setShowProjectOffcanvas(true);
									}}
								>
									{item?.name}
								</a>
							</td>
							<td>{dateFormatted(item.startDate)}</td>
							<td>{dateFormatted(item.endDate)}</td>
							<td>
								<span className={`badge ${getStatusColorCode(item.status)}`}>
									{item.status}
								</span>
							</td>
						</tr>
					))}
				</tbody>
			</Table>
			<RenderProjectOffcanvas project={recent} show={showProjectOffcanvas} handleClose={handleCloseProjectOffcanvas} />
		</div>
	);
};

export default RecentProjects;
