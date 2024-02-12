export const error = (res, err) => {
	return res.status(500).send(err);
};