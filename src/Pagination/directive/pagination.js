import { dependencies } from '../../external/dependencies'
import template from '../template/template.html'
import {
    on,
    last,
    range,
    query,
    props,
    addClass,
    removeClass,
    getDOMState
} from '../../utils'


export default class Pagination {
    constructor(){
        this.restrict = 'EA'
        this.replace = true
        this.scope = {
            change:'=?',
            size:'=',
            cursor:'=?'
        }
        this.template = template
    }

    compile($tElement, tAttrs, transclude){
        this.hasJumper = $tElement[0]::props('jumper')
        if(this.hasJumper){
            let jumper =
            `<div class="fm-pagination-jumper">
                <span>{{::('Go' | translate)}}</span>
                <input class="fm-pagination-jumper-input" />
                <span>{{::('page' | translate)}}</span>
            </div>`
            $tElement[0]::last(jumper)
        }
        return this.link
    }

    @dependencies('$scope', '$element')
    controller(scope, $elem){
        let elem = $elem[0]
        let prevLabel = elem::query('.fm-pagination-prev')
        let nextLabel = elem::query('.fm-pagination-next')
        scope.pages = []
        scope.items = range(scope.size > 0 ? scope.size : 0, 1)
        scope.current = (scope.cursor <= scope.size && scope.cursor) || 1
        scope.first = () => scope.items[0]
        scope.last = () => scope.items[scope.items.length - 1]
        scope.next = () => scope.current++ && _renderPages()
        scope.prev = () => scope.current-- && _renderPages()
        scope.choose = (item, exec = true) => {
            if(item === '...') return
            scope.current = item
            _renderPages()
            if(exec) typeof scope.change === 'function' && scope.change(item)
        }

        let _renderPages = () => {
            let arr = [scope.current]
            let len = scope.items.length
            let pivot = Math.round(scope.items.length / 2)
            let num = 6
            let f = false

            if(scope.current > pivot) f = true

            let n = f ? -1 : 1
            for(let i = 1; num > 3 && scope.items[scope.current - n - 1] !== undefined; i++, num--, n = f ? -i : i){
                f
                ? arr.push(scope.items[scope.current - n - 1])
                : arr.unshift(scope.items[scope.current - n - 1])
            }

            let m = f ? -1 : 1
            for(let j = 1; j !== num + 1 && scope.items[scope.current + m - 1] !== undefined; j++, m = f ? -j : j){
                f
                ? arr.unshift(scope.items[scope.current + m - 1])
                : arr.push(scope.items[scope.current + m - 1])
            }

            if(1 !== arr[0]) {
                arr = 2 === arr[0] ? [1].concat(arr) : [1,'...'].concat(arr)
            }

            if(scope.last() !== arr[arr.length - 1]) {
                arr = scope.last() - 1 === arr[arr.length - 1] ? arr.concat([scope.last()]) : arr.concat(['...', scope.last()])
            }

            scope.pages = arr
            scope.current === scope.last() ? nextLabel::addClass('hide') : nextLabel::removeClass('hide')
            scope.current === scope.first() ? prevLabel::addClass('hide') : prevLabel::removeClass('hide')
        }
    }

    link(scope, $elem, attrs, ctrl){
        let elem = $elem[0]
        let jumperInput =  elem::query('.fm-pagination-jumper-input')
        if(this.hasJumper){
            jumperInput::on('keydown', e => {
                if(e.keyCode !== 13 || !/^\d*$/.test(jumperInput.value)) return
                e.preventDefault()
                let value = jumperInput.value
                if(value <= scope.size && value > 0){
                    scope.choose(~~jumperInput.value)
                    scope.$apply()
                    jumperInput.value = ''
                }
            })
        }
        scope.choose(scope.current, false)
    }
}
