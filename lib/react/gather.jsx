"use strict";

var VoteButton = React.createClass({
	cancelVote: function (e) {
		socket.emit("gather:vote", {
			leader: {
				candidate: null
			}
		});
	},
	vote: function (e) {
		e.preventDefault();
		socket.emit("gather:vote", {
			leader: {
				candidate: parseInt(e.target.value, 10)
			}
		});
	},
	render: function () {
		if (this.props.currentGatherer === null) {
			return false;
		}
		if (this.props.currentGatherer.leaderVote === this.props.candidate.id) {
			return (
				<button 
					onClick={this.cancelVote} 
					className="btn btn-xs btn-success">Voted
				</button>
			);
		} else {
			return (
				<button 
					onClick={this.vote} 
					className="btn btn-xs btn-default"
					value={this.props.candidate.id}>Vote
				</button>
			);
		}
	}
});

var JoinGatherButton = React.createClass({
	joinGather: function (e) {
		e.preventDefault();
		socket.emit("gather:join", {});
	},
	render: function () {
		var message = this.props.buttonName || "Join Gather";
		var buttonClass = "btn btn-primary";
		if (this.props.buttonClass) {
			buttonClass += " " + this.props.buttonClass;
		}
		return (<button 
							onClick={this.joinGather} 
							className={buttonClass}>{message}</button>)
	}
});

var SelectPlayerButton = React.createClass({
	selectPlayer: function (e) {
		e.preventDefault();
		socket.emit("gather:select", {
			player: parseInt(e.target.value, 10)
		})
	},
	render: function () {
		if (this.props.gatherer.leader) {
			return (<button 
				className="btn btn-xs btn-default"
				data-disabled="true">Leader</button>);
		} else {
			return (<button
				onClick={this.selectPlayer}
				value={this.props.gatherer.id}
				className="btn btn-xs btn-primary"> Select
				</button>
			);
		}
	}
});

var GatherTeams = React.createClass({
	alienGatherers: function () {
		return this.props.gather.gatherers.filter(function (gatherer) {
			return gatherer.team === "alien";
		}).sort(function (gatherer) {
			return (gatherer.leader) ? 1 : -1;
		});
	},
	marineGatherers: function () {
		return this.props.gather.gatherers.filter(function (gatherer) {
			return gatherer.team === "marine";
		}).sort(function (gatherer) {
			return (gatherer.leader) ? 1 : -1;
		});
	},
	render: function () {
		var extractGatherer = function (gatherer) {
			var image;
			if (gatherer.leader) {
				image = (<img src="/images/commander.png" 
					alt="Commander" 
					height="20"
					width="20" />);
			}
			return (
				<tr key={gatherer.id}>
					<td className="col-md-1">{image}</td>
					<td className="col-md-11">{gatherer.user.username}</td>
				</tr>
			);
		}
		var marines = this.marineGatherers().map(extractGatherer);
		var aliens = this.alienGatherers().map(extractGatherer);
		return (
			<div className="panel-body">
				<div className="row">
					<div className="col-md-6">
						<div className="panel panel-default">
							<div className="panel-heading">
								Aliens
							</div>
							<table className="table">
								<tbody>
									{aliens}
								</tbody>
							</table>
						</div>
					</div>
					<div className="col-md-6">
						<div className="panel panel-default">
							<div className="panel-heading">
								Marines
							</div>
							<table className="table">
								<tbody>
									{marines}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
		);
	}
})

var GatherProgress = React.createClass({
	stateDescription: function () {
		switch(this.props.gather.state) {
			case "gathering":
				return "Waiting for more gatherers.";
			case "election":
				return "Currently voting for team leaders.";
			case "selection":
				return "Waiting for leaders to picking teams.";
			case "done":
				return "Gather completed.";
			default:
				return "Initialising gather.";
		}
	},
	gatheringProgress: function () {
		var num = this.props.gather.gatherers.length;
		var den = 12;
		var remaining = den - num;
		var message = (remaining === 1) ? "Waiting for last player" : "Waiting for " + remaining + " more players";
		return {
			num: num,
			den: den,
			message: message
		};
	},
	electionProgress: function () {
		var num = this.props.gather.gatherers.reduce(function (acc, gatherer) {
			if (gatherer.leaderVote) acc++;
			return acc;
		}, 0);
		var den = 12;
		return {
			num: num,
			den: den,
			message: den - num + " more votes required"
		};
	},
	selectionProgress: function () {
		var num = this.props.gather.gatherers.reduce(function (acc, gatherer) {
			if (gatherer.team !== "lobby") acc++;
			return acc;
		}, 0);
		var den = 12;

		return {
			num: num,
			den: den,
			message: num + " out of " + den + " players assigned"
		};
	},
	render: function () {
		var progress;
		var gatherState = this.props.gather.state;
		if (gatherState === 'gathering' && this.props.gather.gatherers.length) {
			progress = this.gatheringProgress();
		} else if (gatherState === 'election') {
			progress = this.electionProgress();
		} else if (gatherState === 'selection') {
			progress = this.selectionProgress();
		}
		if (progress) {
			var style = {
				width: Math.round((progress.num / progress.den * 100)) + "%"
			};
			return (
				<div className="panel-body">
					<p><strong>{this.stateDescription()}</strong> {progress.message}</p>
					<div className="progress">
					  <div className="progress-bar progress-bar-striped active" 
					  	data-role="progressbar" 
					  	data-aria-valuenow={progress.num} 
					  	data-aria-valuemin="0" 
					  	data-aria-valuemax={progress.den} 
					  	style={style}>
					  </div>
				  </div>
				</div>
			);
		} else {
			return false;
		}
	}
});

var GatherActions = React.createClass({
	leaveGather: function (e) {
		e.preventDefault();
		socket.emit("gather:leave");
	},
	confirmTeam: function (e) {
		e.preventDefault();
		socket.emit("gather:select:confirm");
	},
	inviteToGather: function (e) {
		e.preventDefault();
	},
	render: function () {
		var joinButton;
		if (this.props.currentGatherer) {
			joinButton = (<li><button 
							onClick={this.leaveGather} 
							className="btn btn-danger">Leave Gather</button></li>);
		} else {
			joinButton = (<li><JoinGatherButton /></li>);
		}

		var confirmTeam;
		if (this.props.currentGatherer &&
					this.props.currentGatherer.leader &&
					this.props.gather.state === 'selection' &&
					this.props.gather.gatherers.every(function (gatherer) {
						return gatherer.team !== 'lobby';
					}) ) {
			if (this.props.currentGatherer.confirm) {
				confirmTeam = (
					<li>
						<button
							className="btn btn-default"
							data-disabled="true"
							>
							Confirmed
						</button>
					</li>
				);
			} else {
				confirmTeam = (
					<li>
					<button
						className="btn btn-primary"
						onClick={this.confirmTeam}
						>
						Confirm Team
					</button>
					</li>
				);
			}
		}

		var inviteButton;
		if (this.props.gather.state === 'gathering') {
			inviteButton = (<li><button
							onClick={this.inviteToGather}
							className="btn btn-primary">Invite to Gather</button></li>);
		}

		return (
			<div className="panel-footer text-right">
				<ul className="list-inline">
					{confirmTeam}
					{inviteButton}
					{joinButton}
				</ul>
			</div>
		);
	}
});

var Gather = React.createClass({
	getDefaultProps: function () {
		return {
			gather: {
				gatherers: []
			}
		}
	},
	componentDidMount: function () {
		var self = this;
		socket.on("gather:refresh", function (data) {
			self.setProps({
				gather: data.gather,
				currentGatherer: data.currentGatherer
			});
		});
	},
	
	render: function () {
		if (this.props.gather.state === 'done') {
			return (<h1>Gather Completed! Now restart the app</h1>);
		}

		
		var gatherTeams;
		if (this.props.gather.state === 'selection') {
			gatherTeams = <GatherTeams gather={this.props.gather} />
		}
		return (
			<div className="panel panel-default">
				<div className="panel-heading">
					<strong>NS2 Gather </strong>
					<span className="badge add-left">{this.props.gather.gatherers.length}</span>
				</div>
				<Gatherers gather={this.props.gather} currentGatherer={this.props.currentGatherer} />
				{gatherTeams}
				<GatherProgress gather={this.props.gather} />
				<GatherActions {...this.props} />
			</div>
		);
	}
});

var Gatherers = React.createClass({
	render: function () {
		var self = this;
		var gatherers = this.props.gather.gatherers.map(function (gatherer) {
			// Switch this to online status
			var online= (<div className="dot online"></div>);

			var division = (<span className="label label-primary">{gatherer.user.ability.division}</span>);
			var action;

			if (self.props.gather.state === 'gathering') {
				action = (
					gatherer.user.ability.lifeforms.map(function (lifeform) {
						return (<span className="label label-default">{lifeform}</span>);
					})
				);
			}

			if (self.props.gather.state === "election") {
				var votes = self.props.gather.gatherers.reduce(function (acc, voter) {
					if (voter.leaderVote === gatherer.id) acc++;
					return acc;
				}, 0)
				action = (
					<span>
						<small>{votes + " votes"} &nbsp;</small>
						<VoteButton currentGatherer={self.props.currentGatherer} candidate={gatherer} />
					</span>
				);
			}

			if (self.props.gather.state === 'selection') {
				action = (
					<span>
						<SelectPlayerButton gatherer={gatherer} />
					</span>
				);
			}

			return (
				<tr key={gatherer.user.id}>
					<td className="col-md-2">{online}</td>
					<td className="col-md-4">{gatherer.user.username}</td>
					<td className="col-md-3">{division}&nbsp;</td>
					<td className="col-md-3 text-right">{action}&nbsp;</td>
				</tr>
			);
		})
		if (this.props.gather.gatherers.length) {
			return (
				<div className="panel-body">
					<div className="panel panel-default">
						<div className="panel-heading">
							<h5 className="panel-title">Roster</h5>
						</div>
						<table className="table roster-table">
							<tbody>
								{gatherers}
							</tbody>
						</table>
					</div>
				</div>
			);
		} else {
			return (<div className="panel-body text-center"><JoinGatherButton buttonClass="btn-lg" buttonName="Start a Gather" /></div>);
		}
	}
});



