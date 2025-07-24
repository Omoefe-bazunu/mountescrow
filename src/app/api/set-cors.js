import configureCors from "../../../setCors";

export default async (req, res) => {
  const success = await configureCors();
  res.status(success ? 200 : 500).json({ success });
};
