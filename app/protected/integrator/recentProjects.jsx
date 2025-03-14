import React, { useEffect } from 'react';
import { Table } from 'react-bootstrap';
import { useProjectDashboard } from '../../../hooks/useProjectDashboard';
import { dateFormatted } from '../../../utils/helpers';
import ProgressBar from '../../../src/components/common/ProgressBar';

const RecentProjects = () => {
	const { handleRecent, data } = useProjectDashboard();
	
	useEffect(() => {
		handleRecent();
	}, []);

	const getStatusColorCode = (status) => {
		const colors = {
			canceled: 'bg-danger',
			unpaid: 'bg-warning',
			inactive: 'bg-info',
			active: 'bg-primary',
			past_due:'bg-secondary'
		};
		return colors[status] || 'bg-secondary'; 
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
						<tr key={index}>	
							<td>{item.name}</td>						
							<td>{dateFormatted(item.startDate)}</td>
							<td>{dateFormatted(item.endDate)}</td>
							<td>{item.tasks}</td>
							<td>
								<div className="d-flex row align-items-center">
									<ProgressBar value={item.progress} max={100}  />
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
			
		</div>
	);
};

export default RecentProjects;
