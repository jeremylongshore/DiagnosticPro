export const sendSlackNotification = async (message: string, channel?: string) => {
  try {
    const { apiClient } = await import("@/services/api");

    const response = await apiClient.post("/notifications/slack", {
      message,
      channel: channel || "#general",
    });

    if (!response.data) {
      console.error("Failed to send Slack notification");
    }
  } catch (error) {
    console.error("Error sending Slack notification:", error);
  }
};
