# purpose
extend this open source project and build a service that allow WeChat user to scan a QR code and create/connect to claude code sesssions, Like they could talk to a  remote agent.

## scope
the original project support a lot of agents and platforms, but we:

- Only care about Personal WeChat platform, not 企业微信（wecom or wechat work）
- Only care about claude code agent


## Use case / workflow
- we create a project from backend administative page, a project if the living place of a type of agent
- we expose the projects to user, but from the user's point view, a projcet is a type Agent they could connect and talk to
- User enters one of the projects/agents, and scans the QR code and connects 
- User sends messages and gets replies


## The Actual changes needed (discuss with me if you don't agree after you have understood the existing codebase)
Seems the original project has all the functionality we need. But it's designed to be a single user product/tool. So currently we need to operate directly from the backend admin web to connect a new WeChat account. We just need to add a new user-facing Web, list the interal projects (project is a internal term, maybe we should call it Agents in user-facing scenarios, and allow user to connect to a project/agent, basically the same internal logic.

- minimum change
- no change to existing code, we only add things
- new code should be in a new separate folder, not mix up with existing code
- no backend code  needed, only front code 







