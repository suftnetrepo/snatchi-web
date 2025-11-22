import { getShortDescription } from "./helps";
import { FCMNotificationService } from "./push-notification";

const fcmService = new FCMNotificationService();

function buildProjectMessages(project) {
  // Extract start/end times from ISO dates
  const start = new Date(project.startDate);
  const end = new Date(project.endDate);

  const formatTime = (d) => d.toISOString().substring(11, 16); // HH:MM
  const startTime = formatTime(start);
  const endTime = formatTime(end);

  // Build activeDays set (UTC-safe)
  let activeDays = new Set();
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    let day = d.getUTCDay();                // 0–6
    day = day === 0 ? 7 : day;              // Convert Sun=0 → 7
    activeDays.add(day);
  }

  return project.assignedTo
    .filter(a => a.id && a.id.fcm)
    .map(a => {
      const user = a.id;

      const addProjects = JSON.stringify([
        {
          projectId: project._id,
          id: project._id,
          integrator: project.integrator,
          siteName: project.name,
          latitude: project.location?.coordinates[0],
          longitude: project.location?.coordinates[1],
          radius: 200,
          startDate: project.startDate,
          endDate: project.endDate,
          startTime,
          endTime,
          activeDays: Array.from(activeDays).sort((x, y) => x - y),
          completeAddress: project.completeAddress,
          status: project.status,
          priority: project.priority,
          userId: user._id,
          firstName: user.first_name,
          lastName: user.last_name,
          description: getShortDescription(project.description),
          action: true
        }
      ]);

      return {
        message: {
          token: user.fcm,
          data: { addProjects }
        }
      };
    });
}

function notifyAssignedUsers(project) {
  if (!project || !project.assignedTo?.length) return;

  console.log(`Preparing to notify assigned users for project ${project._id}`);

  (async () => {
    try {
      const title = project.name || "Project Update";
      const shortDesc = getShortDescription(project.description || "");

      const messages = buildProjectMessages(project);

      await Promise.all(
        messages.map(m => {
       
          const payload = JSON.parse(m.message.data.addProjects)[0];
          const name = [payload.firstName, payload.lastName].filter(Boolean).join(" ");
          const body = `${name}, you’ve been assigned: ${shortDesc}`;

          return fcmService.sendNotification(
            m.message.token,
            title,
            body,
            { addProjects: m.message.data.addProjects }
          );
        })
      );
    } catch (err) {
      console.error("Notification error:", err);
    }
  })();
}


export { buildProjectMessages, notifyAssignedUsers };
