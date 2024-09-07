const Info = ({ account, accountBalance }) => {
	return(
		<div className="my-3">
			<p><strong>Account:</strong> {account}</p>
			<p><strong>Token Owned:</strong> {accountBalance}</p>
		</div>
	)
}
export default Info;