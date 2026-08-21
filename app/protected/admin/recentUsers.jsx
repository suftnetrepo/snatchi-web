import React, { useEffect } from 'react';
import { Table } from 'react-bootstrap';
import { useDashboard } from '../../../hooks/useDashboard';
import { dateFormatted } from '../../../utils/helpers';

const RecentUsers = () => {
		const { handleRecent, data, loading, error } = useDashboard();

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
		<div className="table-responsive mt-4">
			{error && <div className="alert alert-light border" role="alert">Recent organisations could not be loaded.</div>}
			<Table className="table align-middle mb-0">
				<thead>
					<tr>
						<th>Organisation</th>
						<th>Date</th>
						<th>Mobile</th>
						<th>Email</th>
						<th>Status</th>
						<th>Plan</th>

					</tr>
				</thead>
				<tbody>
					{loading && <tr><td colSpan="6" className="text-center text-muted py-4">Loading recent organisations…</td></tr>}
					{!loading && !data?.length && <tr><td colSpan="6" className="text-center text-muted py-4">No organisations have been created yet.</td></tr>}
					{data?.map((item) => (
						<tr key={item._id}>
							<td>
								<div className="d-flex align-items-center">
									<img
									src={item.secure_url || '/img/blank.png'}
										alt={item.name}
										className="rounded-circle me-2"
										width="40"
										height="40"
										onError={(e) => {
											e.target.onerror = null;
											e.target.src = "/img/blank.png";
										}}
									/>
									<span>{item.name}</span>
								</div>
							</td>
							<td>{dateFormatted(item.createdAt)}</td>

							<td>{item.mobile}</td>
							<td>{item.email}</td>
							<td>
								<span className={`badge ${getStatusColorCode(item.status)}`}>
									{item.status}
								</span>
							</td>
							<td>{item.plan}</td>
						</tr>
					))}
				</tbody>
			</Table>
		</div>
	);
};

export default RecentUsers;
