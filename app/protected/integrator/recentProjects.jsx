import React, { useEffect, useState } from 'react';
import { Table } from 'react-bootstrap';
import { useRouter } from 'next/navigation';
import { useProjectDashboard } from '../../../hooks/useProjectDashboard';
import { dateFormatted, getStatusColorCode } from '../../../utils/helpers';
import ProgressBar from '../../../src/components/common/ProgressBar';
import RenderProjectOffcanvas from '../../protected/guest/dashboard/renderProjectOffcanvas';

const RecentProjects = () => {
	const router = useRouter();
	const [showProjectOffcanvas, setShowProjectOffcanvas] = useState(false);
	const [project, setProject] = useState({});
	const { handleRecent, handleSelect, recent, data } = useProjectDashboard();

	console.log("........data", data)

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
						<th>Tasks</th>
						<th>Progress</th>
						<th>Status</th>
					</tr>
				</thead>
				<tbody>
					{data?.map((item, index) => (
						<tr key={item.projectId || index}>
							<td>
								<a
									className="pointer"
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
							<td>{item.tasks}</td>
							<td>
								<div className="d-flex row align-items-center">
									<ProgressBar value={item.progress ?? item.percentage ?? 0} max={100} />
								</div>
							</td>
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
