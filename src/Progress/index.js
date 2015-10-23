import factory from '../utils/directives'
import line from './directive/line'

import './css/progress.css'

const component = {
    namespace:'Fermi.progress',
    inject:[]
}

export default angular.module(component.namespace, component.inject)
	.directive('fermiLineprogress', factory.create(line))
	.name;