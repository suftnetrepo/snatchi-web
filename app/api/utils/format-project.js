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

  // Build activeDays set
  let activeDays = new Set();
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    let day = d.getDay(); // 0–6
    day = day === 0 ? 7 : day; // Convert Sunday=0 → 7
    activeDays.add(day);
  }

  // Base project payload (stringified)
  const addProjects = JSON.stringify([
    {
      projectId: project.project_number || project._id,
      id: project._id,
      integrator: project.integrator,
      siteName: project.name,
      latitude: project.location?.coordinates[0],
      longitude: project.location?.coordinates[1],
      radius: 200, // or map from project if available
      startDate: project.startDate,
      endDate: project.endDate,
      startTime,
      endTime,
      activeDays: Array.from(activeDays).sort((a, b) => a - b),
      completeAddress: project.completeAddress,
      status: project.status
    }
  ]);

  // Build one message per assigned person (if fcm exists)
  return project.assignedTo
    .filter(a => a.id.fcm) // only those with valid fcm
    .map(a => ({
      message: {
        token: a.id.fcm,
        data: {
          addProjects
        }
      }
    }));
}

function notifyAssignedUsers(project) {
  if (!project || !project.assignedTo?.length) return;

  (async () => {
    try {
      const title = project.name || "Project Update";
      const shortDesc = getShortDescription(project.description || "");

      const messages = buildProjectMessages(project);
      const addProjects = messages[0].message.data.addProjects;

      await Promise.all(
        project.assignedTo
          .filter(a => a.id?.fcm)
          .map(a => {
            const name = [a.id.first_name, a.id.last_name].filter(Boolean).join(" ");
            const body = `${name}, you’ve been assigned: ${shortDesc}`;

            return fcmService.sendNotification(
             'egK4PvM8ZE6hnmDh_yJKd8:APA91bESfcxH4fdsOP1_q-GYBZx52VTCriWOnSyCAL8-doCkx0UaOdeZSRqAREy_tjSQvIgr3qVuyaLdPL-CJfR4wAD1hY3VbS5R1-6dE87W-ULyRJm_vhE',
              title,
              body,
              { addProjects }
            );
          })
      );
    } catch (err) {
      console.error("Notification error:", err);
    }
  })();
}

export { buildProjectMessages, notifyAssignedUsers };
