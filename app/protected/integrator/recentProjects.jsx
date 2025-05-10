import React, { useEffect } from 'react';
import { Table } from 'react-bootstrap';
import { useProjectDashboard } from '../../../hooks/useProjectDashboard';
import { dateFormatted, getStatusColorCode } from '../../../utils/helpers';
import ProgressBar from '../../../src/components/common/ProgressBar';

const RecentProjects = () => {
	const { handleRecent, data } = useProjectDashboard();
	
	useEffect(() => {
		handleRecent();
	}, []);

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
									<ProgressBar value={70} max={100}  />
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
