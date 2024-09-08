import ProgressBar from 'react-bootstrap/ProgressBar'

const Progress = ({ maxTokens, tokenSold }) => {
	return(
		<div className='my-3'>
			<ProgressBar now={((tokenSold / maxTokens) * 100)} label={`${(tokenSold / maxTokens) * 100}%`} />
			<p className='text-center my-3'>{tokenSold} / {maxTokens} Tokens Sold</p>
		</div>


	)
}

export default Progress;